# turborepo-cache

Self-hosted remote Turborepo cache for Cloudflare Workers.

## Usage

1. Set up a Cloudflare account
1. Clone this repo
1. Create a Github Actions Secret `CLOUDFLARE_ACCOUNT_ID` and set it to your Cloudflare account ID
1. Create an access token in Cloudflare and store it as the Github Actions Secret `CLOUDFLARE_API_TOKEN`
1. Run `yarn`
1. Run `yarn wrangler login` to authenticate
1. Run `yarn wrangler kv:namespace create "TURBO_CACHE"` to create a KV namespace, and replace this line in `wrangler.toml`
    ```toml
    { binding = "TURBO_CACHE", id = "fe734ad580ec407f9fec0aeba92d0407" }
    ```
    with what the previous command tells you to.
1. Generate a secret value to authenticate your requests. You can use this command for example:
    ```
    node -p 'require("crypto").randomBytes(32).toString("hex")'
    ```
1. Store this value as a secret in your Cloudflare Account:
    ```
    wrangler secret put SECRET_TOKEN
    ```
    and paste it when asked to.
1. Store the same value as an Github Actions secret `TURBO_CACHE_TOKEN` in the repo you want to use Turborepo Remote Caching in.
1. Store the address of your worker as another secret `TURBO_CACHE_SERVER` in the same repo.
1. Configure an env variable in your workflows:
    ```yml
    env:
    TURBO_FLAGS: "--api=${{ secrets.TURBO_CACHE_SERVER }} --token=${{ secrets.TURBO_CACHE_TOKEN }} --team=<your-team-name>"
    ```
    and append it to every command that uses Turborepo, e.g.
    ```yml
    - name: Compile TypeScript code
      run: yarn build $TURBO_FLAGS
    ```
