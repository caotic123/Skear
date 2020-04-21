const func = require ('/home/tiago/AppBuild/components/lib/func.js')

const mongoose = require('mongoose');
const app = require('http').createServer()
const io = require('socket.io')(app);
const {OAuth2Client} = require('google-auth-library');
const R = require('ramda');

(async () => {

  let state = []
  let state_stack = []

  const Packing = state => ({
    send_answer_login : () => (state.client).emit("login_sucess", {ok : true, token : state.data.token}),
    send_to_complete_languages : () => (state.client).emit("first_acess", {ok : true, token : state.data.token})
  })
  
  const change_state = x => f => {
    const push_ = x => y => !x ? [y] : (() => {let v = x.push(y); return v}) ()

    let t = ({trying : false, operations : !!state_stack[x] ? push_(state_stack[x].operations) (f) : [f]})
    state_stack[x] = t
  }
  
  const save_state = x => {
    state_stack[x].trying = true;
  
    for (const v of state_stack[x].operations) {
      v()
    }
  
    state_stack[x].trying = false;
    state_stack[x].operations = null;
  }
  
  const await_state = () => new Promise (resolve => {
    let f = () => state_stack[x].trying ? f() : resolve()
  })
   
  async function user_online(x) {
    await await_state()
    return !!state[x]
  }

  await mongoose.connect('hidded :)', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  var Schema = mongoose.Schema;
  var users_scheme = new Schema({
    id: String,
    name : String,
    givenName : String,
    familyName : String,
    email : String,
    profile_photo : String,
    first_acess : Boolean
   })

   var session_scheme = new Schema({
    id_user : String,
    time :  String,
    first_acess : Boolean
   })

   const users = mongoose.model("users", users_scheme)

   const session = mongoose.model("sessions", session_scheme)
    
   const db_find1 = y => y.findOne
   
   function registerUser(data) {
    let user_new = new users({...data, ...({first_acess : true})});
    return (new Promise (resolve => user_new.save ((r, s) => {
      resolve()
    })))
   }

   async function getUser(x) {
    return new Promise(resolve => users.findOne({id : x}, (r, s) => {
      resolve (func.Maybe.check_null(s))
    }))
   }

   function getTokenByID(x) {
    return (new Promise (resolve => session.findOne({id_user: x}, ((r, s) => {
      resolve((func.Maybe.check_null(s)))
    }))));
   }

  
   function recieve({client, data}, event_name, f) {
   
     const certificate_user = async ({id, token}) => {
       func.Maybe.match_optional
         (({token_db}) => {
           return (token == token_db) 
          })
         (() => {
           return false;
         })
         (!!id && !!token ? await getUser(id) : func.Maybe.Nothing()) 
     }

     client.on(event_name, async data => {
       const {token, id} = data
       if (await certificate_user({id, token})) {
         f(data)
       } else {
          //unauthorized action
       }
     })
   }

   function registerActions(token) {
     func.Maybe.match_optional
       (x => {
         recieve(x, "edit_langs_profile", data => {
           console.log(data)
         })
         
       })
       (() => {
       })
       (func.Maybe.check_null(users[token]))

   }

   async function newSession(data, socket) {
      const {token, id} = data
     
      change_state(token) (() => {
        let k = {data : data, client : socket};
        users[token] = k
       })

       save_state(token)
       Packing(users[token]).send_answer_login()

       registerActions(token)
       return token
    }


  

    function toHome(token) {
      
      let user = users[token]
  
      if (user.data.first_acess) {
        Packing(users[token]).send_to_complete_languages()
      } else {

      }

    }

    mongoose.set('useFindAndModify', false)
    app.listen(8080);

    io.on('connection', function (socket) {
      socket.on('request_login', async data => {
        const user = {... ({token :  data.idToken}), ... data.user}
        const {id, token, name, givenName, familyName, email, profile_photo} = user
 ////
        //  Autentificar o token google
                                    ///

        let maybe_user = await getUser(id)
        
        func.Maybe.match_optional 
          (async (x) => {
            toHome(await newSession({...(x.toObject()), token : token}, socket))
           }) 
          (async () => {
            await registerUser(user)
            toHome(await newSession(user, socket))
           })
          (maybe_user)

        })
  });
}) ()