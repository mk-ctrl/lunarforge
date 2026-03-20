const url = new URL('https://script.google.com/macros/s/AKfycbymTF_DGFXvQlOYDY9ZjxD6wuOos6mRhlgRP7OBJL3QrCrQMEFT1ZiUp1M_iYs6tClr/exec');
url.searchParams.append('action', 'login');
url.searchParams.append('teamId', 'CN-LF01');
url.searchParams.append('password', 'testpass');

fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow'
}).then(res => res.text()).then(text => console.log('Response:', text)).catch(console.error);
