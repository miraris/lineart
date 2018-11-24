const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('koa-router');
const mongo = require('koa-mongo');

const app = new Koa();
const router = new Router();

router.get('/', async (ctx) => {
  const coll = await ctx.mongo.db('lineart').collection('images');

  const n = await coll.estimatedDocumentCount();
  const r = Math.floor(Math.random() * n);

  ctx.body = await coll
    .find()
    .limit(1)
    .skip(r)
    .toArray();
});

app
  .use(mongo({ uri: 'mongodb://mongo' }))
  .use(cors({ origin: '*' }))
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
