const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

router.get('/', (ctx, next) => {
  ctx.body = { data: 'henlo' };
});

app
  .use(router.routes())
  .use(router.allowedMethods())
  .use(cors());

app.listen(3000);
