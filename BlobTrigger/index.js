const { Octokit, App } = require("octokit");
const { createAppAuth } = require("@octokit/auth-app");
module.exports = async function (context, myBlob) {
    context.log("JavaScript blob trigger function processed blob \n Blob:", context.bindingData.blobTrigger, "\n Blob Size:", myBlob.length, "Bytes");
    context.log(new TextDecoder('utf-8').decode(myBlob));

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
};