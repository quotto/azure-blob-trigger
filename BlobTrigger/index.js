const { Octokit, App } = require("octokit");
const { createAppAuth } = require("@octokit/auth-app");
module.exports = async function (context, myBlob) {
    context.log("JavaScript blob trigger function processed blob \n Blob:", context.bindingData.blobTrigger, "\n Blob Size:", myBlob.length, "Bytes");

    // myBlobをJSONに変換
    const json = JSON.parse(myBlob.toString());

    const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: process.env["APP_ID"],
            privateKey: process.env["PRIVATE_KEY"],
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