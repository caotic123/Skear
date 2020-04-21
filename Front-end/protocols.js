module.exports = socket => ({
    request_login : data => socket.emit("request_login", data),
    send_info_langs : data => socket.emit("edit_langs_profile", data)
})