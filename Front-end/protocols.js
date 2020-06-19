let header = user => data => ({id : user.id, token : user.token, data : data})

module.exports = socket => ({
    request_login : data => socket.emit("request_login", data),
    send_info_langs : user => data => socket.emit("edit_langs_profile", header(user)(data)),
    request_home_page : user => data => socket.emit("request_home", header(user)(data)),
    request_topics_like : user => data => socket.emit("request_topics_like", header(user)(data)),
    request_like_topic : user => data => socket.emit("request_like_topic", header(user)(data)),
    request_partners : user => data => socket.emit("request_partners", header(user)(data)),
    request_like : user => data => socket.emit("like_partner", header(user)(data))
})