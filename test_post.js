const url = 'https://script.google.com/macros/s/AKfycbxrl4LqczUGHAotosip7a6DQds0pjMhlLdfTZ8NS7WsULIKJdBERmjTOgF7sqpZ_5vc/exec';

const data = {
    teamName: "Test Team",
    teamSize: 1,
    leadName: "Test Lead",
    leadBatch: "271234",
    leadPhone: "1234567890",
    domain: "Web",
    problemStatement: "Test"
};

fetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
})
.then(response => response.text())
.then(text => console.log("Response:", text))
.catch(err => console.error("Error:", err));
