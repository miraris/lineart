const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('koa-router');
const mongo = require('koa-mongo');

const app = new Koa();
const router = new Router();

router.get('/', async (ctx) => {
  // const coll = ;

  ctx.body = await ctx.mongo
    .db('lineart')
    .collection('images')
    .aggregate([{ $match: { rating: 's' } }, { $sample: { size: 1 } }])
    .toArray();
});

app
  .use(mongo({ uri: 'mongodb://mongo' }))
  .use(cors({ origin: '*' }))
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
