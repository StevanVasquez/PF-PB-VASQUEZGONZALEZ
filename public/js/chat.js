let socket = io()

let chatBox = document.getElementById('chatBox')
let sendChat = document.getElementById('sendBtn')
function sendMessage() {
    socket.emit('message', {
        user: document.getElementById('username').innerText,
        message: chatBox.value
    });
    chatBox.value = ''
}
sendChat.addEventListener('click', event => {
    if (chatBox.value.trim().length > 0) {
        sendMessage()
    }
});
chatBox.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
        if (chatBox.value.trim().length > 0) {
            sendMessage()
        }
    }
});
socket.on('logs', data => {
    const logs = document.getElementById('messagesLogs')
    let messages = ''
    data.forEach(message => {
        messages += `
        <div class="flex items-center self-end rounded-xl rounded-tr py-2 px-3">
        <p><i>${message.user}</i>: ${message.message}</p>
        </div>`
    })
    logs.innerHTML = messages
});
socket.on('alert', () => {
    alert('Nuevo usuario conectado!')
});