# lineart
some lineart magic stuff to learn mongo, some image processing and node `worker_threads`

### usage
set desired workers in `worker.env` and `touch acme.json && chmod 600 acme.json` then start with `docker-compose up`.

### prod
when using in prod, modify the `traefik.toml` and `worker.env` to meet your requirements and create `acme.json` then run

```sh
nvim traefik.toml
nvim worker.env
install -m 600 /dev/null acme.json
docker network create web && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
