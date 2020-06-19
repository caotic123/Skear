# (Ongoing) Skear

The project aims to make the processing of learning a new language more easy and funny. Skear connects peoples who are learning the same language and likes the same topics.

Essentially the complexity of this project it's provides some way of people sharing the same language and interests be able to connect (yes, it's like a social bubble).

It's entirely written in javascript and uses react-native as front-end and node.js + socket.io as back-end. Also, MongoDB and elasticsearch database services construct a reliable database relation (trying to be efficient...).

# What was implemented
  - Authentification (Google Auth + MongoDb)
  - Some componentes and animations (backgroud_slide, loading_screen, bar_status)
  - Language picker screen
  - Match system (sake of vector space search of elasticsearch)
  - The Feed of topics
     - Animations (V)
     - Searching of topics (by two principles : one, for "likes" (as in sql) (for example : Bana, matchs Banana) and by syntax assimilation (like fuzzy logic))
  - Match Component
     - Like animation component (When you like someone the screen rearrange)

# Internals
  - Write idiomatic and expressive javascript is a little tricky (so, a lot of helper library is used to help)
  - Avoiding null (please)
  - No OO (just personal decision), instead functional and imperative.

# What needs to be implemented
  - Chat, video-chat
  - Live Rooms
  - Maybe more :#

It's a [hallo](https://hallo.tv) inspiration. Thanks hallo ;)
