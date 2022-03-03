const express = require('express');
const serveStatic = require("serve-static");
const path = require("path");
const fs = require("fs");


const timeWatch = false;
const port = "3000";


const app = express();

// Parse URL-encoded bodies (as sent by HTML forms)
// こっちはJSONならいらんかも？
// app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
// expandedはよくかわらん、limitはbodyデータ量の制限（初期は１００ｋｂ）
app.use(express.json({ extended: true, limit: '1000mb' }));


// Access the parse results as request.body
// request.bodyは配列にオブジェクトが入った状態でくる(stringにして(stringify)送っても、オブジェクトになってる)
app.post("/datas/*", function(request, response) {
    if(timeWatch)console.time("時間計測---データをファイル書き込み");
    console.log("postリクエスト受け取りました");

    // ファイル名（現在時間）を作成
    const d = new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }));
    const ds = d.getFullYear()+"_"+(d.getMonth()+1+"").padStart(2,"0")+"_"+(d.getDate()+"").padStart(2,"0")+"--"+(d.getHours()+"").padStart(2,"0")+"_"+(d.getMinutes()+"").padStart(2,"0")+"_"+(d.getSeconds()+"").padStart(2,"0");
    
    
    // ファイル書き込み
    fs.writeFileSync("."+request.path+"/"+ds+".json", JSON.stringify(request.body,null,"\t") , 'utf8');
    if(timeWatch)console.timeEnd("時間計測---データをファイル書き込み");
    response.send("りくえすとうけとりました 時間:"+ ds +"  場所 : 0" + request.path);
});

app.get("/datas/*", function(request, response) {
    if(timeWatch)console.time("時間計測---データを送る");
    console.log("getリクエスト受け取りました");
    const filenames = fs.readdirSync("."+request.path);
    
    // 一番新しいファイル探す　一番最後に来る？っぽいからいらんかも
    const ii = [];
    for(let i = 0 ; i < filenames.length ; i++)
    {
        // ディレクトリだとバグるから除く
        if(fs.statSync("."+request.path+"/"+filenames[i]).isDirectory())continue;
        ii[i] = Number(filenames[i].slice(0,20).replace(/--/g,"").replace(/_/g,""));
    }
    const filenamesN = ii.lastIndexOf(ii.reduce(function(a, b) {return Math.max(a, b);}));


    console.log("返すファイル : ",filenames[filenamesN]);

    const kaesuyatu = fs.readFileSync("."+request.path+"/"+filenames[filenamesN], 'utf8')
    response.send(kaesuyatu);
    if(timeWatch)console.timeEnd("時間計測---データを送る");
});


app.use(serveStatic(path.normalize(path.resolve(".")), { index: ["index.html", "index.htm"] }));
app.listen(3000,function(){console.log("サーパーを開きました ポート番号:"+port);});