const { Octokit } = require("octokit");
const { createAppAuth } = require("@octokit/auth-app");
const {ContainerClient} = require('@azure/storage-blob');
module.exports = async function (context, myBlob) {
    // myBlobをJSONに変換
    const json = JSON.parse(new TextDecoder('utf-8').decode(myBlob));

    // privateキーはそのまま環境変数に設定すると改行コードが上手く認識されないため
    // 改行コードを「\n」という文字で置換している。（つまりは「\\n」）
    // このためプログラム内で再び改行コードに戻す。
    const privateKey = process.env["PRIVATE_KEY"].replace(/\\n/g, '\n');
    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: process.env["APP_ID"],
            privateKey: privateKey,
            installationId: process.env["INSTALLATION_ID"],
        },
    });

    // GitHub Actions起動
    const response = await octokit.rest.actions.createWorkflowDispatch({
        owner: process.env["OWNER"],
        repo: process.env["REPO"],
        workflow_id: process.env["WORKFLOW_ID"],
        ref: process.env["REF"],
        inputs: {
            owner: json.owner,
            department: json.department,
            rgName: json.rgName,
            rgRegion: json.rgRegion
        }
    });

    // 正常に起動すればトリガーで受け取ったファイルを削除する
    if (response.status == 204) {
        context.log("GitHub Actions has been started.Delete blob file");

        const containerName = "sftp";
        const blobName = context.bindingData.name;
        const blobService = new ContainerClient(`${process.env.storageaccountsftp9999_STORAGE};EndpointSuffix=core.windows.net`, containerName);
        try {
            const deleteResponse = await blobService.deleteBlob(blobName);
            context.log(JSON.stringify(deleteResponse));
            if(deleteResponse.errorCode) {
                return {
                    status: 500,
                    body: `Delete blob error: ${deleteResponse.errorCode}`
                }
            } else {
                return {
                    status: 200
                }
            }
        } catch (e) {
            context.log(e)
            return {
                status: 500,
                body: "Unexpected error"
            }
        }
    } else {
        return {
            status: 500,
            body: JSON.stringify(response.data)
        }
    }
};