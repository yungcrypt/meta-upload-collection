import * as fs from "fs-extra"
import Bundlr from '@bundlr-network/client';

const getWallet = (args) => {
  const wallet_option = args;
  return JSON.parse(fs.readFileSync(wallet_option, { encoding: "utf8" }));
};

const uploadMetadata = async (filename_no_ext, image_url, collectionFolder) => {
  const data = fs.readJSONSync(process.cwd() + collectionFolder + `/metadata/${filename_no_ext}.json`);

  data.image = image_url;
  data.properties.files[0].uri = image_url;
/*  data.animation_url = video_url;
  data.properties.files[1].uri = video_url;
*/
  // write and read back the metadata
  fs.writeJSONSync(process.cwd()+collectionFolder+`/metadata/${filename_no_ext}.json`, data);
};

const parseArgs = () => {
  const myArgs = process.argv.slice(2);
  if (myArgs.length != 1) {
    throw "Specify keypair path";
  }
  return myArgs[0];
};

const runUploadWithWallet = async (wallet, bundlr, collectionFolder) => {
const imageFolder = (process.cwd()+collectionFolder+"/image");
console.log(imageFolder)
  const image_filenames = fs.readdirSync(imageFolder);
  console.log(process.cwd())

    image_filenames.map(async (item, i) => {
    console.log(i)
    const no_ext_filename = item
      .split(".")
      .slice(0, -1)
      .join(".");

    // push image URL to arweave by way of bundlr
    console.log(
      process.cwd()+collectionFolder+`/image/${no_ext_filename}.png`
    )
    const respImg = await bundlr.uploader.uploadFile(
      process.cwd()+collectionFolder+`/image/${no_ext_filename}.png`
    );
   /* const respVideo = await bundlr.uploader.uploadFile(
      process.cwd()+`/images/${no_ext_filename}.mp4`
    const videoUrl = `https://arweave.net/${respVideo.data.id}?ext=mp4`;
    ); 
   */

    const imageUrl = `https://arweave.net/${respImg.data.id}?ext=png`;
  const data = fs.readJSONSync(process.cwd()+collectionFolder+`/metadata/${no_ext_filename}.json`);

    console.log(imageUrl);

    if (typeof imageUrl === "string") {
      // push metadata to arweave by way of bundlr
      await uploadMetadata(no_ext_filename, imageUrl, collectionFolder);

      const respMeta = await bundlr.uploader.uploadFile(
        process.cwd()+collectionFolder+`/metadata/${no_ext_filename}.json`
      );

      const metaUrl = `{
        "collection_uri": "https://arweave.net/${respMeta.data.id}",
        "collection_name": "${data.collection.name}" 
      }`;

      // write out the metadataurl to a txt file
      fs.writeFileSync(process.cwd()+collectionFolder+`/output.json`, metaUrl);

      console.log(metaUrl);
    }
  }
  )
}

export const runUpload = async (walletKeyPair, collectionFolder) => {
  console.log(collectionFolder)
  const bundlr = new Bundlr(
            'https://devnet.bundlr.network',
            'solana',
            walletKeyPair.secretKey,
            {
              timeout: 60000,
              providerUrl: 'https://metaplex.devnet.rpcpool.com',
            },
          )
  await bundlr.fund(10000000)
  console.log(await(bundlr.getLoadedBalance()).toString())

  await runUploadWithWallet(walletKeyPair.secretKey, bundlr, collectionFolder);
};

