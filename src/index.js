import { ethers } from 'ethers';
import cryptorunnerNFTABI from './cryptorunner_nft_abi.js';

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD',
};

let _mainnet;
function mainnet(env) {
    _mainnet ||= new ethers.providers.StaticJsonRpcProvider({
        url: env.MAINNET_ENDPOINT,
        skipFetchSetup: true,
    });
    return _mainnet;
}

let _signer;
function signer(env) {
    _signer ||= new ethers.Wallet(env.SIGNER_PRIVATE_KEY);
    return _signer;
}

const RUNNER_ADDR = '0xD05f71067876A68336c836aE602981728034a84c';
let _runnerContract;
function runnerContract(env) {
    _runnerContract ||= new ethers.Contract(RUNNER_ADDR, cryptorunnerNFTABI, mainnet(env));
    return _runnerContract;
}

async function notFound(request) {
    return new Response(JSON.stringify({error: 'not found'}),
        {
            status: 404,
            headers: headers,
        });
}

async function sign(env, hash) {
    return signer(env).signMessage(ethers.utils.arrayify(hash));
}

async function runnerHandler(request, env) {
    const url = new URL(request.url);
    const re = /^\/runner\/(\d+)$/;
    const [_, tokenId] = re.exec(url.pathname);
    return Promise.all([
        mainnet(env).getBlock(),
        runnerContract(env).ownerOf(tokenId),
    ]).then(([{ timestamp }, owner]) => {
        const hash = ethers.utils.solidityKeccak256(
            ['uint256', 'address', 'uint256'],
            [parseInt(tokenId), owner, timestamp]
        );
        return Promise.all([
            {
                tokenId,
                owner,
                timestamp,
                hash,
            },
            sign(env, hash),
        ]);
    }).then(([response, signature]) => {
        return new Response(JSON.stringify({
            ...response,
            signature,
        }), {
            status: 200,
            headers: headers,
        });
    });
}

function handler(pathname) {
    const routes = [
        [/^\/runner\/.+$/, runnerHandler],
    ];

    for (let i=0; i < routes.length; i++) {
        const [re, handler] = routes[i];
        if (re.test(pathname)) {
            return handler;
        }
    }
    console.log(pathname, 'not found');

    return notFound;
}

export default {
  async fetch(request, env) {
      const url = new URL(request.url);
      return handler(url.pathname)(request, env);
  },
};
