const url = 'https://script.google.com/macros/s/AKfycby7ghxX8IomwUeXAVA7hgKYg3mURyxM_1XmqeFHff5tj-XIiLs_AS9LDy2LsKNkiTD8sQ/exec';

const testData = {
    teamId: 'TEST-1234',
    teamName: 'Debug Team',
    githubUrl: 'https://github.com/debug',
    videoUrl: 'https://youtube.com/debug'
};

async function runTest() {
    console.log("Sending POST 1...");
    let res = await fetch(url, { method: 'POST', body: JSON.stringify(testData) });
    console.log("Response 1:", await res.json());

    console.log("\nSending POST 2 (Should Update)...");
    let res2 = await fetch(url, { method: 'POST', body: JSON.stringify(testData) });
    console.log("Response 2:", await res2.json());
}

runTest();
