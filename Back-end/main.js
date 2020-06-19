const { Maybe, $, certification, pair, cons, isOkay, justWait, select } = require('/home/tiago/AppBuild/components/lib/func.js')

const mongoose = require('mongoose');
const app = require('http').createServer()
const io = require('socket.io')(app);
const { OAuth2Client } = require('google-auth-library');
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });
const R = require('ramda');

//might be temporary
//generate_simply_token = (x) => {
//let random = () => (Math.floor ((Math.random() + 0.1) * 10))
// let ran = x => R.map(x => random(), R.range(1, 10))
// return new Promise(resolve => x + "_" + R.reduce((x, y) => x + R.toString(y), 0, ran(x)))
//}

(async () => {

  let state = {}
  let state_stack = []

  const Packing = state => ({
    send_answer_login: () => (state.client).emit("login_sucess", { ok: true, token: state.data.token }),
    send_to_complete_languages: (data) => (state.client).emit("first_acess", { ok: true, token: state.data.token, data: data }),
    send_to_home_like: (data) => (state.client).emit("home_like", { ok: true, token: state.data.token, data: data }),
    send_topics: (data) => (state.client).emit("info_topics_likes", { ok: true, token: state.data.token, data: data }),
    send_like_notification: (data) => (state.client).emit("user_liked_topic", { ok: true, token: state.data.token, data: data }),
    send_partners: (data) => (state.client).emit("user_partners", { ok: true, token: state.data.token, data: data }),

  })

  const change_state = x => f => {
    const push_ = x => y => !x ? [y] : (() => { let v = x.push(y); return v })()

    let t = ({ trying: false, operations: !!state_stack[x] ? push_(state_stack[x].operations)(f) : [f] })
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

  const await_state = (x) => new Promise(async resolve => {
    while (state_stack[x].trying) {
      await justWait(1000)
    }

    resolve()
  })

  async function user_online(x) {
    await await_state(x)
    return !!state[x]
  }

  async function user_(token) {
    await await_state(token)
    return Maybe.check_null(state[token])
  }

  await mongoose.connect('mongodb+srv://caotic:12asterisco@cluster0-y4w1r.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  function push_action(token, f) {
    const status = state[token].status
    new Promise(async resolve => {
      change_state(token)(() => {
        status.next.push(f)
      })
      save_state(token)
      await await_state(token)
      if (!status.running) {
        (async () => {
          change_state(token)(() => {
            status.running = true
          })
          save_state(token)
          await await_state(token)
          await status.next.shift()()
        })()
      }
      resolve()
    })
  }

  const next_action = async (token) => {
    await await_state(token)
    if (state[token].status.next.length > 0) {
      change_state(token)(async () => {
        await state[token].status.next.shift()()
      })
      save_state(token)
    } else {
      change_state(token)(() => {
        state[token].status.running = false
      })
      save_state(token)
    }
  }

  const Schema = mongoose.Schema;
  const users_scheme = new Schema({
    id: String,
    name: String,
    givenName: String,
    familyName: String,
    email: String,
    photo: String,
    first_acess: Boolean
  })

  const topics = mongoose.model("topics", (() => {
    let scheme = new Schema({
      name: String,
      users: Number
    })
    scheme.index({ name: "text" }, { unique: true })
    return scheme
  })()
  )
  const user_topics = mongoose.model("users_topics", (() => {
    let scheme = new Schema({
      id_user: String,
      topics: [String]
    })
    scheme.index({ user: "text" }, { unique: true })
    scheme.index({ topics: -1 })
    return scheme
  })()
  )

  const likes = mongoose.model("likes", (() => {
    let scheme = new Schema({
      id: String,
      partner: String
    })

    scheme.index({ user: "id" })
    scheme.index({ user: "liked" })
    return scheme
  })()
  )

  const topic_likes = mongoose.model("topic_likes", new Schema({
    id_user: String,
    topic_id: String,
    time: Number
  }))

  const users = mongoose.model("users", users_scheme)

  const langs = mongoose.model("langs", new Schema({
    id_user: String,
    lang: String,
    level: Number,
    native: Boolean
  }))

  const destruct_optional = R.uncurryN(3, Maybe.match_optional)

  const promisse_optional = x => y =>
    destruct_optional(new Promise(async resolve => { await x(); resolve() }))
      (new Promise(async resolve => { await y(); resolve() }))


  const db_find1 = y => y.findOne

  function registerUser(data) {
    let user_new = new users({ ...data, ...({ first_acess: true }) });
    return (new Promise(resolve => user_new.save((r, s) => {
      resolve()
    })))
  }

  async function getUser(x) {
    return new Promise(resolve => users.findOne({ id: x }, (r, s) => {
      resolve(Maybe.check_null(s))
    }))
  }

  function getTokenByID(x) {
    return (new Promise(resolve => session.findOne({ id_user: x }, ((r, s) => {
      resolve((Maybe.check_null(s)))
    }))));
  }

  function getUserLanguages(id) {
    return langs.find({ id_user: id })
  }

  async function addUserLanguage(id, data) {
    await langs.deleteMany({ id_user: id })
    data.map(async x => {
      await new langs({ ...x, id_user: id }).save()
    })
  }

  async function setFirstAcess(id, first_acess) {
    await users.updateOne({ id: id }, { first_acess: first_acess })
  }

  const safe_search = json => new Promise(async resolve => {
    try {
      resolve(await client.search(json))
    } catch (v) {
      resolve({ body: { hits: { hits: [] } }, failed: true })
    }
  })

  function elastic_getTopic(name) {
    return (new Promise(async resolve => {
      const { body: { hits: { hits } } } = await safe_search({
        index: 'topics',
        body: {
          query: {
            term: {
              "name.keyword": name
            }
          }
        }
      })

      destruct_optional(async ([{ _id, _source }]) => {
        resolve({ ..._source, _id: _id })
      },
        async () => {
          const v = await client.index({
            index: 'topics',
            refresh: 'wait_for',
            body: { name: name, users: 0 }
          })
          resolve({ ...{ name: name, users: 0 }, _id: v.body._id })
        },
        (Maybe.check_empty(hits)))
    }))
  }

  async function elastic_lazy_fillTopicDescription(id_user, topic) {
    return (new Promise(async resolve => {
      const fake_lazy = async () => new Promise(async resolve => {
        const { body: { hits: { hits } } } = await safe_search({
          index: 'topics',
          body: {
            query: {
              term: {
                "name.keyword": topic
              }
            }
          }
        })

        destruct_optional(async ([{ _id, _source }]) => resolve({ ..._source, _id: _id }),
          async () => {
            resolve({ name: topic, _id: null, users: 0 })
          },
          (Maybe.check_empty(hits)))
      })
      const { _id, name, users } = await fake_lazy()
      resolve({
        topic: name, likes: users, whoLikes: [],
        liked: _id ? await like_topic(id_user, _id) : false
      })
    }))
  }

  const like_topic = (id_user, _id) => new Promise(async resolve =>
    resolve(destruct_optional(x => true, () => false,
      ((Maybe.check_null(await topic_likes.findOne({ id_user: id_user, topic_id: _id })))))))

  async function searchTopics(topic, from) {
    const query = {
      "index": "topics",
      "size": 25,
      "from": from,
      "body": {
        "query": {
          "more_like_this": {
            "fields": ["name"],
            "like": topic.toLowerCase(),
            "min_term_freq": 1,
            "max_query_terms": 12,
            "min_doc_freq": 1
          }
        },
        "sort": {
          "users": "desc"
        }
      }
    }

    return (new Promise(async resolve => {
      const { body: { hits: { hits } } } = await safe_search(query)
      resolve(hits)
    }))

  }

  async function getTopTopics(from) {
    const query = {
      "index": "topics",
      "size": 20,
      "from": from,
      "body": {
        "sort": {
          "users": "desc"
        }
      }
    }
    return (new Promise(async resolve => {
      const { body: { hits: { hits } } } = await safe_search(query)
      resolve(hits)
    }))
  }


  function getTopUsersByTopic(id_topic) {
    return (new Promise(async resolve => resolve(await topic_likes.find({ topic_id: id_topic }).limit(4).sort({ _id: -1 }))))
  }

  function fillTopicDescription(id_user, topic) {
    return (new Promise(async resolve => {
      const { _id, name, users } = topic
      resolve({
        topic: name, likes: users, whoLikes: await Promise.all((await getTopUsersByTopic(_id)).map(async x =>
          destruct_optional(
            ({ name, photo }) => ({ name, url: photo }),
            () => nil,
            (await getUser(x.id_user)))
        )), liked:
          destruct_optional(x => true, () => false, (
            (Maybe.check_null(await topic_likes.findOne({ id_user: id_user, topic_id: _id })))))
      })
    }))
  }

  function elastic_check_list_of_topics(id_user) {
    return ((f, f__) => new Promise (async resolve => {
      const { body: { hits: { hits } } } = await safe_search({
        index: "list_topics",
        body: {
          query: {
            term: {
              user_id: id_user
            }
          }
        }
      })

      return resolve (destruct_optional (f, f__, (Maybe.check_empty(hits))))
  }))
}

  function elastic_update_topics(id_user, _query_topics = null) {
    return new Promise(async resolve => {

      await elastic_check_list_of_topics(id_user)(
        async ([x]) => {
          await client.update({
            index: 'list_topics',
            id: x._id,
            body: {
              script: {
                lang: 'painless',
                source: `ctx._source.topics = '${(await user_topics.findOne({ id_user: id_user }).select("topics -_id")).toObject().topics}'`,
              }
            }
          })
          resolve()
        },
        async () => {
          await client.index({
            index: 'list_topics',
            refresh: "wait_for",
            body: {
              user_id: id_user,
              topics: (await user_topics.findOne({ id_user: id_user }).select("topics -_id")).toObject().topics,
              interacted: [id_user],
              time: Date.now()
            }
          })
          resolve()

        })
    })
  }

  function userLikeTopic(id_user, _id) {
    return new Promise(async resolve => {
      await user_topics.updateOne({ id_user: id_user }, { $push: { topics: _id } }).setOptions({ upsert: true })
      const _query_topics = await topic_likes.updateOne({ id_user: id_user, topic_id: _id }, { id_user: id_user, topic_id: _id }).setOptions({ upsert: true })
      await elastic_update_topics(id_user)
      resolve()
    })
  }

  async function userRemoveLikeTopic(id_user, _id) {
    return new Promise(async resolve => {
      await user_topics.updateOne({ id_user: id_user }, { $pull: { topics: _id } })
      await topic_likes.deleteOne({ id_user: id_user, topic_id: _id })
      await elastic_update_topics(id_user, await topic_likes.findOne({ id_user: id_user }))
      resolve()
    })
  }

  function getUserInteractions(id) {
    return interactions.find({ id: id })
  }

  function elastic_add_interaction(id_user, partner) {
    return new Promise(async resolve => {

      await elastic_check_list_of_topics(partner.id)(
        async ([x]) => {
          await client.update({
            index: 'list_topics',
            id: x._id,
            refresh : "wait_for",
            body: {
              script: {
                lang: 'painless',
                source: `ctx._source.interacted.add(params.partner)`,
                params : {
                  partner : id_user
                }
              }
            }
          })
          resolve()
        }, async () => {
          await client.index({
            index: 'list_topics',
            refresh: "wait_for",
            body: {
              user_id: partner.id,
              topics: (await user_topics.findOne({ id_user: partner.id }).select("topics -_id")).toObject().topics,
              interacted: [id_user, partner.id],
              time: Date.now()
            }
          })
          resolve()
      })
    })
  }

  function add_interaction(id, partner) {
    return new Promise(async resolve => {
      await elastic_add_interaction(id, partner)
      await likes.updateOne({id : id}, {partner : partner.id}).setOptions({upsert : true})
      resolve()
    })
  }

  function get_elastic_partner(id_user, q, list_avoid) {
  return new Promise(async resolve => {
    const _query_topics = await user_topics.findOne({ id_user: id_user }).select("topics -_id")

    if (_query_topics == null || _query_topics.toObject().topics.length < 1) {
      return resolve([])
    }

    const query = {
      "index": "list_topics",
      "size" : q,
      "body": {
        "query": {
          "bool": {
            "must": [
              {
                "more_like_this": {
                  "fields": ["topics"],
                  "like": _query_topics.toObject().topics,
                  "min_term_freq": 1,
                  "max_query_terms": 12,
                  "min_doc_freq": 1
                }
              },
              {
                "bool": {
                  "must_not": [
                    {
                      "term": { "interacted": id_user }
                    }
                  ]
                }
              }]
          }
        }
      },
      "sort": {
        "time": "desc"
      }
    }

    if (list_avoid.length > 0) {
      query.body.query.bool.must[1].bool.must_not.push({"terms" : {
        "user_id" : list_avoid
      }})
    }

    return resolve((await client.search(query)).body.hits.hits.map(({ _source }) => _source))
  })
}

function recieve({ client, data, status }, event_name, f) {
  const certificate_user = async ({ id, token }) =>
    Maybe.match_optional
      ((internal) => {
        return id == internal.data.id
      })
      (() => {
        return false;
      })
      (await user_(token))

  client.on(event_name, async data => {
    const { token, id, req } = data

    if (await certificate_user({ id, token })) {
      push_action(token, () => f(data))
    } else {
      //unauthorized action
    }
  })
}


function registerActions(token) {

  Maybe.match_optional
    (x => {
      recieve(x, "edit_langs_profile", ({ id, token, data }) => new Promise(async resolve => {
        let erros = []
        const certifications = [
          pair(() => data)(certification.Proposition.isListNotEmpty)
        ]
        const lang_certification = [
          pair("lang")(certification.Proposition.isAvaliableLanguage),
          pair("level")(certification.Proposition.isInteger),
          pair("native")(certification.Proposition.isBool)
        ]

        Maybe.match_optional
          (value => {
            destruct_optional(
              (_ => {
                addUserLanguage(id, data)
                setFirstAcess(id, false)
                Packing(state[token]).send_to_home_like()
                resolve(next_action(token))
              })
                (() => { resolve(next_action(token)) }),
              (isOkay(data.reduce((c, v) => c.concat(certification.check(lang_certification)(v)), []))))
          })
          (() => {
            resolve(next_action(token))
            //SERVER CORRECT ANSWER POLITY
          })
          (isOkay(certification.check(certifications)(data)))

      }))

      recieve(x, "request_home", ({ token }) => new Promise(async resolve => {
        let user = state[token]
        if (user.data.first_acess) {
          Packing(user).send_to_complete_languages(await getUserLanguages(user.data.id))
          resolve(next_action(token))
        } else {
          Packing(user).send_to_home_like()
          resolve(next_action(token))
        }
      }))

      recieve(x, "request_topics_like", ({ id, token, data }) => new Promise(async resolve => {

        let user = state[token]
        const certifications = [
          pair("search")(certification.Proposition.isString),
          pair("search")(certification.Proposition.isValidString)
        ]

        const from = data.from != null && data.from <= 100 ? data.from * 20 : 0

        destruct_optional(
          async (x) => {
            const { search } = data

            const search_query = (await elastic_lazy_fillTopicDescription(id, search))

            const requests = await Promise.all((await searchTopics(search, from)).map(
              async ({ _id, _source }) => fillTopicDescription(id, { ..._source, _id: _id })))
            Packing(user).send_topics({ search: search_query, list: requests, update: data.from })
            resolve(next_action(token))
          },
          async () => {
            const requests = await Promise.all((await getTopTopics(from)).map(
              async ({ _id, _source }) => fillTopicDescription(id, { ..._source, _id: _id })))
            Packing(user).send_topics({ list: requests, update: data.from })
            resolve(next_action(token))
          },
          (isOkay(certification.check(certifications)(data))))

      }))

      recieve(x, "request_like_topic", ({ id, token, data }) => new Promise(async resolve => {
        const certifications = [
          pair("topic")(certification.Proposition.isString),
          pair("topic")(certification.Proposition.isValidString)
        ]

        destruct_optional(async (x) => {

          const { _id } = await elastic_getTopic(data.topic)
          if (await like_topic(id, _id)) {
            Packing(state[token]).send_like_notification({
              topic: data.topic,
              liked: false
            })

            await userRemoveLikeTopic(id, _id)
            resolve(next_action(token))
          }
          else {
            Packing(state[token]).send_like_notification({
              topic: data.topic,
              liked: true
            })
            await userLikeTopic(id, _id)

            resolve(next_action(token))
          }

        },
          () => { resolve(next_action(token)) },
          (isOkay(certification.check(certifications)(data))))
      }))

      recieve(x, "request_partners", ({ id, token, data }) => new Promise(async resolve => {
        const certifications = [
          pair("size")(certification.Proposition.isInteger),
          pair("size")(certification.Proposition.isValidPaternSize),
          pair("avoid") (certification.Proposition.isList)
        ]

        destruct_optional(
          async x => {
            const r =
              await Promise.all((await get_elastic_partner(id, data.size, data.avoid)).map(({ user_id }) => getUser(user_id)))
            Packing(state[token]).send_partners(({
              partners: r.map($(Maybe.unsafe_fromJust, select(["name", "id", "photo"])))
            }))
            
            resolve(next_action(token))
          },
          () => {
            resolve()
            // ignore faults
          },

          (isOkay(certification.check(certifications)(data)))
        )

      })
      )

      recieve(x, "like_partner", ({ id, token, data }) => new Promise(async resolve => {
        const certifications = [
          pair("partner")(certification.Proposition.isString),
        ]

        destruct_optional(async x => {
          destruct_optional(async (user) => {
            await add_interaction(id, user)
            resolve(next_action(token))
          },
          () => {resolve(next_action(token)) /*polity of do nothing when is not certified*/},
          await getUser(data.partner))
        },
        () => {
          resolve(next_action(token))
          // polity of do nothing when is not certified
        }
        , isOkay(certification.check(certifications)(data)))
      
      }))

    })
    (() => {
    })

    (Maybe.check_null(state[token]))

}

async function newSession(data, socket) {
  const { token, id } = data

  change_state(token)(() => {
    let k = { data: data, client: socket, status: { running: false, next: [] } };
    state[token] = k
  })

  save_state(token)
  Packing(state[token]).send_answer_login()

  registerActions(token)
  return token
}

mongoose.set('useFindAndModify', false)
app.listen(8080);

io.on('connection', function (socket) {
  socket.on('request_login', async data => {
    //aqui a certificação de data.... 

    const user = { ... ({ token: data.idToken }), ...data.user }
    const { id, token, name, givenName, familyName, email, photo } = user
    ////
    //  Autentificar o token google
    ///

    let maybe_user = await getUser(id)

    Maybe.match_optional
      (async (x) => {
        await newSession({ ...(x.toObject()), token: token }, socket)
      })
      (async () => {
        await registerUser(user)
        await newSession(user, socket)
      })
      (maybe_user)

  })
});
}) ()