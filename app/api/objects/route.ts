import { NextRequest, NextResponse } from "next/server";



import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";



  const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }
  });
export  async function GET(req: NextRequest) {

const prefix = req.nextUrl.searchParams.get("prefix") ?? undefined;
    
//what i have to do
    const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME as string, //flat sturture file receviced
        Delimiter: "/", //folder structure  as specified route as tree structure
        // Prefix: "Aws-s3-clone/", //expecting from frontend
        Prefix: prefix,
        // Prefix:""
    });

    const result =await s3Client.send(command);
    console.log(result);

    const rootFiles = result.Contents?.map((item) => ({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified,

        })) || [];

    const rootFolders = result.CommonPrefixes?.map((item) => ({
            key: item.Prefix,
        })) || [];


    return NextResponse.json({status:200,message:"success",
        files:rootFiles,
        folders:rootFolders
    });
}

//Tasks : AWS S3 Bucket listing object GET


//   "CommonPrefixes": [
//       {
//         "Prefix": "Aws-s3-clone/"
//       }