# lineart
some lineart magic stuff to learn mongo, some image processing and node `worker_threads`

### usage
set desired workers in `worker.env` and `touch acme.json && chmod 600 acme.json` then start with `docker-compose up`.

### prod
when using in prod, modify the `traefik.toml` and start with prod dockerfile override => `docker-compose up -f docker-compose.yml -f docker-compose.prod.yml -d up`.
