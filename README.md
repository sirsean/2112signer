# 2112signer

This is a simple webapp that runs in Cloudflare Workers. It looks up the
owner of a 2112 cryptorunner and signs a message asserting the correct
ownership. As long as you trust the signer, you can then verify this signature
to know whether a given address owns the NFT.

This is useful because the NFT lives on mainnet but your contract may run
in Polygon. Your contract must know the address of the signer to verify its
signatures.

## Develop

```
npx wrangler dev
```

## Publish

```
npx wrangler publish
```
