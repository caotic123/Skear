/* The work of mongodb is to serve as brute data repository, like users information, however
  there are some datas which ... */

  /* topics are essently elastic data based */
  async function getTopic(name) {
    return (new Promise (async resolve => {
      const topic = await topics.findOne({name : name})
      destruct_optional(
        (x) => {
          resolve (x)
        },
        async () => {
          resolve (await topics.create({name : name, users : 0}))
        },
        Maybe.check_null(topic)
      )
    }))
   }

   /*topics likes is a mongodb brute information */
   async function elastic_like_topic (id_user, id_topic) {
    return (new Promise (async resolve => resolve (destruct_optional(
      async _ => true,
      async () => false, 
      (Maybe.check_empty((await client.search({
        index: 'topics_like',
        body: {
          query: {
            term : {
              topic_id : id_topic,
              id_user : id_user
            }
          }
        }
      })).body.hits.hits))))))
   }

   function fillTopicDescription(id_user, topic) {
    return (new Promise (async resolve => {
      const {_id, name, users} = await getTopic(topic)
      resolve ({topic : name, likes : users, whoLikes : [], liked : 
       destruct_optional(x => true, () => false, (
         (Maybe.check_null (await topic_likes.findOne({id_user : id_user})))))})
    }))
  }
  
  function lazy_fillTopicDescription (id_user, topic) {
    return (new Promise (async resolve => {
      const {_id, name, users} = (x => x == null ? {name : topic, _id : null, users : 0} : x) (await topics.findOne({name : topic}))
      resolve ({topic : name, likes : users, whoLikes : [], liked : await like_topic(id_user, _id)})
    }))}


