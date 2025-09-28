import ky from "ky";
import { NextResponse } from "next/server";
import { ApiResponse, Row } from "./schema";

const NPM_REGISTRY_REPLICATE_URL = "https://replicate.npmjs.com/registry";
async function* toAsyncIterable<T>(arr: T[]): AsyncIterable<T> {
  for (const item of arr) {
    yield item;
  }
}

async function processRowsInParallel(rows: AsyncIterable<number>) {
  const promises: Promise<any>[] = [];

  for await (const row of rows) {
    console.log("ROW : ", row);

    const promise = ky
      .get(
        `${NPM_REGISTRY_REPLICATE_URL}/_all_docs?limit=10000&startkey=${row}`,
      )
      .json<any>();

    promises.push(promise);
  }

  const results = await Promise.all(promises);
  console.log("✅ All rows processed in parallel");

  return results;
}

async function getStartPoint() {
  try {
    // limit, startkey를 같이 쓰면 중복 키가 생길 수 있음

    let arr: Row[] = [];
    const { total_rows, offset, rows } = await ky
      .get(`${NPM_REGISTRY_REPLICATE_URL}/_all_docs?limit=10000`)
      .json<ApiResponse>();

    // CouchDB 2025-09-13 기준: 3628042
    // 36만개 정도의 데이터를 요청 날리는 게 어려울 수도 있어요
    let newOffset = offset;
    let lastkey = rows[rows.length - 1]?.key;
    // let lastKeyDocId = rows[rows.length - 1]?.id;

    console.log("START : ", total_rows, offset, lastkey);
    arr = arr.concat(rows);

    while (total_rows >= newOffset) {
      // if (!lastkey) break; // 예외처리: 마지막 key가 없을 경우 중단

      // const { offset, rows: newRows } = await ky
      //   .get(
      //     `${NPM_REGISTRY_REPLICATE_URL}/_all_docs?limit=10000&startkey="${lastkey}"&startkey_docid="${lastKeyDocId}"`,
      //   )
      //   .json<ApiResponse>();
      const response = await fetch(
        `${NPM_REGISTRY_REPLICATE_URL}/_all_docs?limit=10000&startkey="${lastkey}"`,
      );
      // .json<ApiResponse>();
      const { offset, rows: newRows } = await response.json();
      console.log("NEXT : ", total_rows, offset);

      if (!offset) break;

      arr = arr.concat(newRows);
      newOffset = offset + 1;
      lastkey = newRows[newRows.length - 1]?.key;
      // lastKeyDocId = newRows[newRows.length - 1]?.id;
    }

    return { results: arr, length: arr.length };
  } catch (err: any) {
    // return NextResponse.json(
    //   { error: err.message },
    //   {
    //     status: 500,
    //   },
    // );
    throw new Error(err.message);
  }
}

export async function GET() {
  try {
    const { results, length } = await getStartPoint();
    return NextResponse.json({ results, length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      {
        status: 500,
      },
    );
  }
}
