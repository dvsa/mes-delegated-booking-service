const LOCAL_AUTH_PROXY = async () => ({
    principalId: "some-id",
    context: {
        examinerRole: "DLG",
    },
    policyDocument: {
        Version: "2012-10-17",
        Statement: [{
            Action: "execute-api:invoke",
            Effect: "Allow",
            Resource: "*",
        }],
    },
});

module.exports = { LOCAL_AUTH_PROXY };
