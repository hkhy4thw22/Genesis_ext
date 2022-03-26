"use strict"

const timeWatch = true;
const dbName = 'myDB';
const datasfilediv = "./datas"
const datanames = {url:"url",artist:"artist",group:"group",true_artist:"true_artist",true_group:"true_group",file_relation:"file_relation"};
let imano_rireki = {targetDivName:"menu",targetInfo:"first"};
const modoru_rireki = [];
const noInvesArtistSymbol = Symbol("noInvesArtist");
const noInvesGroupSymbol = Symbol("noInvesGroupSymbol");
const dataPropertys ={
    url:            ["url","name","name_j","$h$artist","$h$group","$t1$status","time","comment"],
    artist:         ["artist_name","$true$true_artist","last_search","$kazu$last_index","comment","$f$attention"],
    group:          ["group_name","$true$true_group","last_search","$kazu$last_index","comment","$f$attention"],
    true_artist:    ["true_artist_name","$t2$grade","comment"],
    true_group:     ["true_group_name","$t2$grade","comment"],
    file_relation:  ["file_name","$t3$file_place","$h$relation_artist","$h$relation_group","comment"]
}
const oneDay = 86400000;
const timeLimited ={1:oneDay*3,2:oneDay*14,3:oneDay*90,4:oneDay*180,5:oneDay*999999};
let error_message_now;
const hozonyadeEvent = new Event("hozonyade");
const resetyadeEvent = new Event("resetyade");
// よく使うボタンは分離してグローバルに
const button_move_back = document.getElementById("move_back");
const button_double = document.getElementById("create_save");
const button_resetbtn = document.getElementById("reset");
const button_menubtn = document.getElementById("gohome");




// 一番最初DBないときファイルからDBつくる
if(localStorage.getItem("databaseFlag") === null){
    myLog('---DB初期処理---');
    localStorage.setItem("databaseFlag",0);
    document.getElementById("status_dbsta").classList.add("status_error_mode");
    document.getElementById("status_save").className = "status_not_ready";
    document.getElementById("matizikan").classList.remove("nodis");
    document.getElementById("top_buttontati").classList.add("nodis");
    document.getElementById("menu").classList.add("nodis");
    for(let xx in datanames)
    {
        if(xx === "url" && timeWatch)console.time("時間計測---ファイルからDBへ : url")
        fetch(datasfilediv+"/"+datanames[xx]+"/")
        .then(function(res){
            return res.text();
        })
        .then(function(res){
            const openReq = indexedDB.open(dbName);
            openReq.onupgradeneeded = function(event){
                myLog('---upgrage処理---');
                const db = event.target.result;
                const store_url = db.createObjectStore(datanames["url"], {keyPath: 'url'});
                store_url.createIndex('url_artist_index', 'artist',{multiEntry:true});
                store_url.createIndex('url_group_index', 'group',{multiEntry:true});
                store_url.createIndex('url_status_index','status');

                const store_artist = db.createObjectStore(datanames["artist"], {keyPath: 'artist_name'});
                store_artist.createIndex("artist_true_index","true_artist")

                const store_group = db.createObjectStore(datanames["group"], {keyPath: 'group_name'});
                store_group.createIndex("group_true_index","true_group")

                db.createObjectStore(datanames["true_artist"], {keyPath: 'true_artist_name'});
                db.createObjectStore(datanames["true_group"], {keyPath: 'true_group_name'});

                const store_file_relation = db.createObjectStore(datanames["file_relation"], {keyPath: 'file_name'});
                store_file_relation.createIndex("file_true_artist_index","relation_artist",{multiEntry:true});
                store_file_relation.createIndex("file_true_group_index","relation_group",{multiEntry:true});
            }
            openReq.onsuccess = function(event)
            {
                const ireruyatu = JSON.parse(res);
                const db = event.target.result;
                const transaction = db.transaction(datanames[xx], "readwrite");
                const store = transaction.objectStore(datanames[xx]);
                let maruten = "〇・・・・・・・・・";
                let nankome = 1;
                for(let i = 0 ; i < ireruyatu.length ; i++)
                {
                    const req = store.add(ireruyatu[i]);
                    if(xx === "url" && i%500 ===0){
                        req.onsuccess = function(){
                            myLog("DBputログ <url> 入れた数 => ",+i);
                        }
                    }
                    if(xx !== "url" && i%100 ===0){
                        req.onsuccess = function(){
                            myLog("DBputログ <"+xx+"> 入れた数 => ",+i);
                        }
                    }
                    // ローディング画面の・・・のやつ
                    // storeにaddする速度は、比例的な感じで上がっていくので、√1/√１０で　１/１０　　√３/√１０で　３/１０　になる　予定 実際は三角形にならないので。。。
                    if(xx === "url"  &&  i !== 0  &&  i % (Math.floor( ireruyatu.length * (Math.sqrt(nankome) / Math.sqrt(10)) )) === 0){
                        nankome++;
                        req.onsuccess = function(){
                            document.getElementById("marutennotoko").textContent = maruten;
                            maruten = ("〇"+maruten).substring(0,10);
                        }
                    }
                }
                transaction.oncomplete =function(){
                    if(xx === "url" && timeWatch)console.timeEnd("時間計測---ファイルからDBへ : url");
                    // Flagを数字にして、６になったら全部おわったってこと
                    localStorage.setItem("databaseFlag",Number(localStorage.getItem("databaseFlag"))+1);
                }
                transaction.onerror = function(){
                    myError("初期動作DB作るやつでなんかエラー");
                }
                db.close();
            }
        })
    }
}

if(document.readyState !== "loading") {
    myLog("read終わってた");
    main();
    } else {
    myLog("read終わってなかった");
    document.addEventListener("DOMContentLoaded", main, false);
}

window.onerror = function(){
    myError("window.onerrorエラー つまり考慮してないやつ");
}





function main(){

    // DB監視 謎バグに備えておく
    // 謎バグ：URLがすんごい多い状況で、URLよりさきにArtistに値を入れると、全部completeなのにArtistが空っぽだった。
    // 発生したら１回閉じて、もっかい開く　頻度的にだるくなったらＤＢ削除ボタンをローディング画面にもつけるとか？
    kansi();
    function kansi()
    {
        // まずDB処理が終わったか確認、終わってたら中身確認
        if(Number(localStorage.getItem("databaseFlag")) < 6){
            setTimeout(function(){
                kansi();
            },1000);
        }else if(Number(localStorage.getItem("databaseFlag")) < 12){
            kansi2();
            for(let xx in datanames)
            {
                const openReq = indexedDB.open(dbName);
                openReq.onsuccess = function(event)
                {
                    const db = event.target.result;
                    const transaction = db.transaction(datanames[xx], "readonly");
                    const store = transaction.objectStore(datanames[xx]);
                    const entrykazu = store.count();
                    entrykazu.onsuccess = function(){
                        if(entrykazu.result === 0) myError("謎バグですコレ");
                        else localStorage.setItem("databaseFlag",Number(localStorage.getItem("databaseFlag"))+1);
                    }
                }
            }
        }else if(Number(localStorage.getItem("databaseFlag")) === 12){
            kansi2();
        }else{
            myError("kansi()でエラー");
        }
    };
    function kansi2(){
        if(Number(localStorage.getItem("databaseFlag")) === 12){
            document.getElementById("matizikan").classList.add("nodis");
            document.getElementById("top_buttontati").classList.remove("nodis");
            document.getElementById("menu").classList.remove("nodis");
            document.getElementById("status_dbsta").classList.remove("status_error_mode");
            document.getElementById("status_save").className = "";
            // lastSaveTime 最終保存時間　無ければ作る
            if(localStorage.getItem("lastSaveTime") === null){
                localStorage.setItem("lastSaveTime",(new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }))).getTime());
            }
        }else{
            setTimeout(function(){
                kansi2();
            },1000); 
        }
    }

    
    // 戻るボタン
    button_move_back.addEventListener("click",function(event){
        const modorisaki = modoru_rireki.pop();
        if(modorisaki === undefined){
            // 戻り先なし、最初のメニューまでもどった
            // そもそも下ので押せなくする
        }else{
            openDiv(modorisaki.targetDivName,modorisaki.targetInfo,true);
            if(modorisaki.targetDivName === "menu" && modorisaki.targetInfo === "first"){
                button_move_back.setAttribute("disabled","disabled");
            } 
        }
    },false);


    // 保存ボタンと編集ボタン兼用予定、classかnameかなにかで動作分ける
    button_double.addEventListener("click",function(event){
        const imanogamendata = hozonDataExtract();
        // hozonDataExtractでエラーのときはnull返ってくる
        if(imanogamendata === null){
            myError("hozonDataExtract から nullが返ってきました");
            return null;
        }
        
        if(button_double.name === "mode_create"){
            // 編集よう
            imanogamendata["category"] = imano_rireki.targetDivName;
            openDiv("create_data",imanogamendata);
        }else if(button_double.name === "mode_hozon"){
            // 保存よう
            let hozonDataType;
            if(imano_rireki.targetDivName === "create_data"){
                hozonDataType = document.getElementById("create_data").category;
            }else{
                hozonDataType = imano_rireki.targetDivName;
            }
            
            myLog("このデータを保存しようとしてます : ",imanogamendata,"   保存するデータの種類は : ",hozonDataType);
            
            // 全部の箇所に書き込めてなかったら(要素null返ってくる) エラー　後で書く
            for(let vv in imanogamendata)
            {
                if(imanogamendata[vv] === null){
                    myError("画面データを保存しようとしましたが、すべてのデータ要素が入力されていません");
                    return null;
                }
            }

            const openReq = indexedDB.open(dbName);
            openReq.onsuccess = function(event)
            {
                const db = event.target.result;
                const transaction = db.transaction(hozonDataType, "readwrite");
                const store = transaction.objectStore(hozonDataType);
                const putreq = store.put(imanogamendata);
                putreq.onsuccess = function(){
                    // POPUPとかで 保存できたで！ を知らせる　後で書く
                    myLog("ほぞんできましいた")
                }
                putreq.onerror = function(){
                    myError("画面データをDBに保存するDBリクエストでエラー")
                }
                db.close();
            }

            button_double.dispatchEvent(resetyadeEvent);
        }
    });
    button_double.addEventListener("hozonyade",function(){
        button_double.value = "保存";
        button_double.name= "mode_hozon";
        button_double.removeAttribute("disabled");
    })
    button_double.addEventListener("resetyade",function(){
        button_double.value = "編集";
        button_double.name= "mode_create";
        if(imano_rireki.targetDivName === "create_data")button_double.setAttribute("disabled","disabled");
    })
    

    // リセットボタン
    // メニューの場合は白紙状態にもどす
    button_resetbtn.addEventListener("click",function(event){
        // りせっとやでEvent
        button_double.dispatchEvent(resetyadeEvent);

        if(imano_rireki.targetDivName === "menu"){
            const m_inputs = document.getElementById("m_searchonoffdiv").getElementsByTagName("input");
            for(let i = 0 ; i < m_inputs.length ; i = i+2)
            {
                m_inputs[i].value="";
            }
            document.getElementById("m_createdatanoffselect").selectedIndex = 0;
            document.getElementById("m_indexeddbffdiv").classList.add("nodis");
            document.getElementById("m_searchonoffdiv").classList.remove("nodis");
            document.getElementById("m_createdatanoffdiv").classList.add("nodis");
        }else{
            openDiv(imano_rireki.targetDivName,imano_rireki.targetInfo,true);
        }
    },false);
    
    
    // メニューボタン
    button_menubtn.addEventListener("click",function(event){
        openDiv("menu","");
    },false);
    
    
    // 実験ボタン
    const button_testtest = document.getElementById("testtest");
    button_testtest.addEventListener("click",function(event){
        openDiv("url",{"url": "55336453/9742","name" : "けつすたいる は 走った2","name_j" : "ketu is run","artist": ["ookido2","satoshi2"],"group": ["ken9zyo","masara"],"status": "asymptote","time" : "2022/01/01/12:23:25","comment" : "8生湿八給高3八鐘㍍"});


    });
    

    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // ステータスバーのところ
    // エラー状況を Ctrl+クリックで消せるように
    document.getElementById("status_error").addEventListener("click",function(event){
        if(event.ctrlKey){
            error_message_now = "[エラー状況]";
            document.getElementById("status_error").title = error_message_now;
            document.getElementById("status_error").classList.remove("status_error_mode");
        }
    });

    // 最終保存時間を表示 & 時間たったら色変えるやつ
    document.getElementById("status_save").addEventListener("mouseenter",function(){
        const last_timeStamp = Number(localStorage.getItem("lastSaveTime"));
        const last_timeStamp_date = (new Date(last_timeStamp)).toLocaleString();
        document.getElementById("status_save").setAttribute("title","最終保存時刻 : " + last_timeStamp_date);
    });
    // 25分 -> 45分 -> 60分 で変化  F5したときすぐ実行してほしいからsetTimeout setIntervalのほうでは無理やった
    let kankaku = 0;
    (function timeStamp_kansi(){
        setTimeout(function(){
            const last_timeStamp = Number(localStorage.getItem("lastSaveTime"));
            const now_timeStamp = (new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }))).getTime();
            const sai_timeStamp = now_timeStamp - last_timeStamp;
            // 最初にクローム起動した時はなんもしない、じゃないとNumber(null) が 0 になってへんになる
            if(localStorage.getItem("lastSaveTime") === null){

            }else if(sai_timeStamp > 60*60000){
                document.getElementById("status_save").className = "status_t3_mode";
            }else if(sai_timeStamp > 45*60000){
                document.getElementById("status_save").className = "status_t2_mode";
            }else if(sai_timeStamp > 25*60000){
                document.getElementById("status_save").className = "status_t1_mode";
            }else{
                document.getElementById("status_save").className = "";
            }
            kankaku = 60000;
            timeStamp_kansi();
        },kankaku);
    })();


    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // メニュー欄の構築
    // データベース欄を表示非表示できるように
    const menu_indexeddb_p =document.getElementById("m_indexeddbffp");
    menu_indexeddb_p.addEventListener("click",function(){
        document.getElementById("m_indexeddbffdiv").classList.toggle("nodis");
    });
    // 検索欄を表示非表示できるように
    const menu_search_p =document.getElementById("m_searchonoffp");
    menu_search_p.addEventListener("click",function(){
        document.getElementById("m_searchonoffdiv").classList.toggle("nodis");
    });
    // 検索欄のサーチボタンに機能追加
    const menu_search_div = document.getElementById("m_searchonoffdiv");
    const search_ptags = menu_search_div.getElementsByTagName("p");
    for(let i = 0 ; i < search_ptags.length ; i++)
    {
        const inputs = search_ptags[i].getElementsByTagName("input");
        inputs[1].addEventListener("click",function(){
            openDiv(inputs[0].name,inputs[0].value);
        })
    }
    // データ作成欄を表示非表示できるように
    const menu_createdata_p =document.getElementById("m_createdatanoffp");
    menu_createdata_p.addEventListener("click",function(){
        document.getElementById("m_createdatanoffdiv").classList.toggle("nodis");
    });
    // データ作成欄のボタンに機能追加
    const menu_createdata_btn = document.getElementById("m_createdatanoffbtn");
    const menu_createdata_select = document.getElementById("m_createdatanoffselect");
    menu_createdata_btn.addEventListener("click",function(){
        if(menu_createdata_select.value === ""){
            // 何も選択してない
        }else{
            openDiv("create_data",{category : menu_createdata_select.value})
        } 
    })
    // DB保存ボタン
    const btnDBsave = document.getElementById("m_DBsave");
    btnDBsave.addEventListener("click",function(){
        if(timeWatch)console.time("時間計測---DBからファイルへ : url")
        const openReq = indexedDB.open(dbName);
        openReq.onsuccess = function(event){
            const db = event.target.result;
            for(let xx in datanames)
            {
                const transaction = db.transaction(datanames[xx],"readonly");
                const store = transaction.objectStore(datanames[xx]);
                const watasuyatu = store.getAll();
                transaction.oncomplete = function(event){
                    fetch(datasfilediv+"/"+datanames[xx]+"/",{
                        method:"post",
                        headers:{
                            'Content-Type': 'application/json'
                        },
                        body:JSON.stringify(watasuyatu.result)
                    })
                    .then(function(res){
                        return res.text();
                    })
                    .then(function(res){
                        if(xx === "url" && timeWatch)console.timeEnd("時間計測---ファイルからDBへ : url")
                        // ステータスバー関係のやつ
                        localStorage.setItem("lastSaveTime",(new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }))).getTime());
                        document.getElementById("status_save").className = "";
                        myLog(res);
                    });
                }
            }
            db.close();
        }
    });
    // DB削除ボタン
    const btnDBdelete = document.getElementById("m_DBdelete");
    const checkDBdelete = document.getElementById("m_DBdelete_hoken");
    checkDBdelete.addEventListener("change",function(){
        if(checkDBdelete.checked)
        {
            btnDBdelete.removeAttribute("disabled");
            setTimeout(function(){
                checkDBdelete.checked = false;
                btnDBdelete.setAttribute("disabled","disabled");
            },1500)
        }else{
            btnDBdelete.setAttribute("disabled","disabled");
        }
    });
    btnDBdelete.addEventListener("click",function(){
        const deleteRequest = indexedDB.deleteDatabase(dbName)
        deleteRequest.onsuccess = function(event){
            myLog("DBdelete完了");
            localStorage.removeItem("databaseFlag");
            localStorage.removeItem("lastSaveTime");
        };
        deleteRequest.onerror = function(event){
            myError("DBdelete失敗error");
        };
    }); 
    // 履歴、保留、全データボタン
    document.getElementById("m_keep_btn").addEventListener("click",function(){
        openDiv("all_file_status",document.getElementById("m_keep_select").value);
    });
    document.getElementById("m_rekisi_btn").addEventListener("click",function(){
        openDiv("rireki","");
    });
    
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // URL欄の構築
    // ステータスを設定できるバーつくる
    const u_statusRange = document.getElementById("u_statusRange");
    const u_status = document.getElementById("u_status");
    u_statusRange.addEventListener("input",function(){
        const status_now = conversion_status(Number(u_statusRange.value));
        u_status.textContent = status_now["mozi"];
        u_status.className = status_now["color"];
    });

    // Artist , Group欄
    // 最終検索日時を更新できるように
    const a_searchUpdata = document.getElementById("a_last_search_update");
    const g_searchUpdata = document.getElementById("g_last_search_update");
    const dotti = [a_searchUpdata,g_searchUpdata];
    const dotti_s = ["a_","g_"]
    for(let i = 0 ; i < dotti.length ; i++)
    {
        dotti[i].addEventListener("click",function(){
            const d = new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }));
            document.getElementById(dotti_s[i]+"last_search").textContent = d.toLocaleString();

            // ほぞんやでEvent
            button_double.dispatchEvent(hozonyadeEvent);
        });
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // 全部共通　の　構築
    // changeにするかinputにするか
    const allTextArea = document.getElementsByTagName("textarea");
    for(let i = 0 ; i < allTextArea.length ; i++)
    {
        allTextArea[i].addEventListener("input",function(event){
            // ほぞんやでEvent
            button_double.dispatchEvent(hozonyadeEvent);
        });
    }


    // message受けれるように、本体は下の下の方にある
    messageListenOn();
}    



//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
// Functionのところ

// MyError
function myError(ss){
    const now_date = (new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }))).toLocaleTimeString();
    console.error(now_date,ss);
    const error_bar = document.getElementById("status_error");
    error_message_now = error_bar.title;
    error_message_now += "\n"+ss;
    error_bar.classList.add("status_error_mode");
    error_bar.setAttribute("title",error_message_now);
}

// MyLog
function myLog(ss){
    const now_date = (new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }))).toLocaleTimeString();
    console.log(now_date+" ――",ss);
}

// DBからオブジェクト取ってくるFanction Promiseで返す indexnameにインデックス名入れるとindexでとってくる（この場合はgetAllなので配列でかえる)
async function myDBget(storeName,id,indexname){
    return new Promise((resolve,reject) => {
        const openReq = indexedDB.open(dbName);
        openReq.onsuccess = function(event){
            const db = event.target.result;
            const transaction = db.transaction(storeName,"readonly");
            const store = transaction.objectStore(storeName);
            if(indexname){
                const store_index = store.index(indexname);
                const getRequestI = store_index.getAll(id);
                getRequestI.onsuccess = function(event2){
                    db.close();
                    resolve(event2.target.result);
                }
            }else{
                const getRequest = store.get(id);
                getRequest.onsuccess = function(event2){
                    db.close();
                    resolve(event2.target.result);
                }
            }
            // 機能しない　（？）
            // transaction.onerror = function(){
            //     myError("myDBgetでエラー storeName : "+storeName+"  key : "+id+"  indexname(あったら) : "+indexname);
            // }
        }
    });
}

// ステータスコードalreadygetとかを実際表示する文字に変換＆色とか決めるクラスを返す
// 文字か番号をもらったら、表示する文字とカラーコードもったオブジェクトを返す
function conversion_status(code){
    const num_to_stringStatusCode = {1:"alreadyget",2:"keep",3:"asymptote",4:"remenber",5:"jftr",6:"poop"};
    const code_to = {
        "alreadyget":   {motomozi:"alreadyget",mozi:"取ってる!",color:"colorgrade_S",num:1,mozishort:"取!",grade:"S"},
        "keep":         {motomozi:"keep",mozi:"保留",color:"colorgrade_Ho",num:2,mozishort:"保",grafe:"non"},
        "asymptote":    {motomozi:"asymptote",mozi:"ほぼほぼほぼ",color:"colorgrade_A",num:3,mozishort:"近",grade:"A"},
        "remenber":     {motomozi:"remenber",mozi:"覚えておく",color:"colorgrade_B",num:4,mozishort:"覚",grade:"B"},
        "jftr" :        {motomozi:"jftr",mozi:"念のため",color:"colorgrade_C",num:5,mozishort:"微",grade:"C"},
        "poop":         {motomozi:"poop",mozi:"うんち",color:"colorgrade_D",num:6,mozishort:"💩",grade:"D"}
    };
    if(typeof code === "number"){
        return conversion_status(num_to_stringStatusCode[code]);
    }else if (typeof code === "string"){
        return code_to[code];
    }else{
        myError("conversion_status で エラー");
    }
}

// オブジェクトコピーするやつ
// プリミティブとオブジェクト、配列にしか対応してない
function copy_object_array(mono)
{
    let copy_mono;
    if(Array.isArray(mono)){
        copy_mono = [];
        for(let i = 0 ; i < mono.length ; i++)
        {
            if(Array.isArray(mono[i])){
                copy_mono[i] = copy_object_array(mono[i]);
            }else if(mono[i] instanceof Object){
                copy_mono[i] = copy_object_array(mono[i]);
            }else{
                copy_mono[i] = mono[i];
            }
        }
    }else if(mono instanceof Object){
        copy_mono = {};
        for(let vv in mono)
        {
            if(Array.isArray(mono[vv])){
                copy_mono[vv] = copy_object_array(mono[vv]);
            }else if(mono[vv] instanceof Object){
                copy_mono[vv] = copy_object_array(mono[vv]);
            }else{
                copy_mono[vv] = mono[vv];
            }
        }
    }else{
        myError("copy_object_array で エラー");
    }
    return copy_mono;
}




// DIV遷移機能をつけるやつ
// 遷移情報はtargetInfoってプロパティのオブジェクトdestinationDIV,destinationInfoにある
// 同じイベントがなんかいも入っちゃう問題があるので、onclickで定義
// マウスオーバーで色チェンジ機能のため、クラス入れる
function tranmotionIn(targetElement)
{
    targetElement.onclick =function(event){
        if(event.ctrlKey){
            openDiv( targetElement.tranInfo.destinationDIV , targetElement.tranInfo.destinationInfo );
        }
    }
    targetElement.classList.add("tranmotionIn");
}


// 情報をDBに保存する これはURLとData_create DIVのやつ
// 保存するデータにはsaveP_〇〇〇ってクラスを設定、〇がプロパティ名、saveT_〇〇〇で保存する方法（pならtextContent,it(input text)ならvalueとか）
function hozonDataExtract2(){
    // まず、いま表示されてるDIVを特定する。create_dataなら表示してるカテゴリーを
    const dataDivs = document.querySelectorAll("#mainnotokoro > div");
    let dataName;
    if(!document.getElementById("url").classList.contains("nodis")){
        dataName = { category:"url" , basyo: document.getElementById("url")};
    }else if(!document.getElementById("create_data").classList.contains("nodis")){
        dataName = { category:document.getElementById("create_data").category , basyo: document.getElementById("create_data")};
    }else{
        myError("hozonDataExtract2でエラー(対象DIVエラー)")
        return null;
    }

    const hozonObj = {};
    for(let i = 0 ; i < dataPropertys[dataName.category].length ; i++)
    {
        const hozonProperty = dataPropertys[dataName.category][i].replace(/\$.+\$/gi,"");
        const hozonElem = dataName.basyo.querySelectorAll(".saveP_"+hozonProperty);

        // saveTごとに分ける
        // pタグ
        if(hozonElem[0].classList.contains("saveT_p")){
            hozonObj[hozonProperty] = hozonElem[0].textContent;
            
        // input text
        }else if(hozonElem[0].classList.contains("saveT_it")){
            hozonObj[hozonProperty] = hozonElem[0].value;

        // input range ステータスいじるバー
        }else if(hozonElem[0].classList.contains("saveT_ir")){
            hozonObj[hozonProperty] = conversion_status(Number(hozonElem[0].value)).motomozi;

        // textArea URL DIV欄だけ処理ちょいわける
        // create_dataのURLもdataName.category = "url" やけど、動くからok
        }else if(hozonElem[0].classList.contains("saveT_textArea")){
            let ss = "";
            if(dataName.category === "url"){
                const tags = hozonElem[0].parentElement.getElementsByTagName("input");
                for(let j = 0 ; j < tags.length ; j++)
                {
                    // checkbox の name とcommentにいれる自家製タグ$〇〇〇$の〇〇〇のところは一致させてる unfinished , homo , anotherone
                    if(tags[j].checked) ss += "$"+tags[j].name+"$";
                }
            }
            ss += hozonElem[0].value;
            hozonObj[hozonProperty] = ss;

        // tokubetu1 URLのartist,group
        }else if(hozonElem[0].classList.contains("saveT_tokubetu1")){
            hozonObj[hozonProperty] = [];
            // まずcheckされてるやつ = メインとしてるアーティストを入れる（もしなかったらおかしいのでnull返す エラーは呼び出し元でだす） 
            for(let j = 0 ; j < hozonElem.length ; j++)
            {
                if(hozonElem[j].parentElement.linkC.checked) hozonObj[hozonProperty][0] = hozonElem[j].textContent;
            }
            if(hozonObj[hozonProperty].length === 0){
                return null;
            } 
            // のこりを入れる
            let kk = 1;
            for(let j = 0 ; j < hozonElem.length ; j++)
            {
                if(!hozonElem[j].parentElement.linkC.checked){
                    hozonObj[hozonProperty][kk] = hozonElem[j].textContent;
                    kk++;
                } 
            }
        // create_dataのartistとかの配列になってるやつ
        }else if(hozonElem[0].classList.contains("saveT_tokubetu2")){
            let kk =0;
            hozonObj[hozonProperty] = [];
            for(let j = 0 ; j < hozonElem.length ; j++)
            {
                if(hozonElem[j].value === "") continue;
                hozonObj[hozonProperty][kk] = hozonElem[j].value;
                kk++;
            }
        // input radio   create_dataのradioのやつ
        // create_data の flagのとこのradioもこれつかうけど、文字列でtrue,false入れるとバグる
        }else if(hozonElem[0].classList.contains("saveT_iradio")){
            for(let j = 0 ; j < hozonElem.length ; j++)
            {
                if(hozonElem[j].checked === true){
                    if(hozonElem[j].value === "true") hozonObj[hozonProperty] = true;
                    else if(hozonElem[j].value === "false") hozonObj[hozonProperty] = false;
                    else hozonObj[hozonProperty] = hozonElem[j].value;
                }
            }
        }else{
            myError("hozonDataExtract2でエラー(saveTエラー)")
        }
        // comment,URLのname_j 以外の要素が入力されてなければnullいれる。しないとそもそもそのプロパティが無い or textだと""になる
        if((hozonProperty !== "comment" && hozonProperty !== "name_j") && (hozonObj[hozonProperty] === undefined || hozonObj[hozonProperty] === "" || hozonObj[hozonProperty].length === 0)) hozonObj[hozonProperty] = null;
    }
    return hozonObj;
}



// 各DIVから保存情報を抜き出す。その後はcreate_dataに渡すか、DBに保存するか Menu,Create_dataでは使わない
// 今開いてるデータのうち変更点（基本コメントだけ。artist,groupは最終検索日時,結果数も）を元のデータとマージする => URL,Create_dataパターンも追加 2 に送る
function hozonDataExtract()
{
    // 今、開いてる画面を特定する imano_rireki
    if(imano_rireki.targetDivName === "menu"){
        myError("hozonDataExtractでエラー(menuじゃん)です");
        return null;
    }
    if(imano_rireki.targetDivName === "create_data" || imano_rireki.targetDivName === "url"){
        return hozonDataExtract2();
    }
    // どうせ変更があれば、編集じゃなくて保存するから大丈夫だけど、念のためオブジェクトコピーでいじる
    const extractObj = copy_object_array(imano_rireki.targetObj);
    const targetElem = document.getElementById(imano_rireki.targetDivName);
    extractObj["comment"] = targetElem.getElementsByClassName("saveP_comment")[0].value;
    if(imano_rireki.targetDivName === "artist" || imano_rireki.targetDivName === "group" )
    {
        extractObj["last_search"] = targetElem.getElementsByClassName("saveP_last_search")[0].textContent;
        extractObj["last_index"] = targetElem.getElementsByClassName("saveP_last_index")[0].value;
    }
    return extractObj;
}



// 指定したdiv要素targetDivName を　指定した指標(key) targetInfo　で開く
function openDiv(targetDivName,targetInfo,rirekioption)
{
    // button_doubleを編集モードに
    button_double.dispatchEvent(resetyadeEvent);

    // とりあえずボタンは全部使えるように
    button_double.removeAttribute("disabled");
    button_resetbtn.removeAttribute("disabled");
    button_menubtn.removeAttribute("disabled");

    // 重いので、all_dataは消す all_file_statusも消す
    document.getElementById("all_tegakari_p").textContent = "";
    document.getElementById("all_fulldata").textContent = null;
    document.getElementById("all_tegakari").textContent = null;
    document.getElementById("allfile_table").textContent = null;

    // targetDivNameに合致したやつだけ表示
    const dataDivs = document.querySelectorAll("#mainnotokoro > div");
    for(let i = 0 ; i < dataDivs.length ; i++)
    {
        if(dataDivs[i].id === targetDivName) {
            dataDivs[i].classList.remove("nodis");
            continue;
        }
        dataDivs[i].classList.add("nodis");
    }

    // create_dataDIVは履歴に残さない
    if(rirekioption || imano_rireki["rirekinokosande"]){

    }else{
        modoru_rireki.push(imano_rireki);
        button_move_back.removeAttribute("disabled");
    }
    imano_rireki = { targetDivName : targetDivName , targetInfo : targetInfo };

    // targetInfo検索いらずはここで分岐
    // CreateData
    if(targetDivName === "create_data") {
        imano_rireki["rirekinokosande"] = true;
        // create_dataのボタン処理
        button_double.setAttribute("disabled","disabled");

        createDiv("create_data",targetInfo);
        return null;

    // AllData
    }else if(targetDivName === "all_data"){
        // all_dataのボタン処理
        button_double.setAttribute("disabled","disabled");
        button_resetbtn.setAttribute("disabled","disabled");
        createDiv("all_data",targetInfo);
        return null;

    // 履歴DIV URL_Status_DIV
    }else if(targetDivName === "rireki" || targetDivName === "all_file_status"){
        button_double.setAttribute("disabled","disabled");
        createDiv(targetDivName,{"hiraku_status":targetInfo});
        return null;

    // MenuDIV
    }else if(targetDivName === "menu") {
        // メニュー欄のボタン処理
        button_double.setAttribute("disabled","disabled");
        button_menubtn.setAttribute("disabled","disabled");
        return null;
    }

    // targetInfoに最初からオブジェクトが入ってた場合 検索し既に合ったら比較、変化なしならDBのを表示、変化ありなら どないすんねんを選択できるように
    // 検索結果無しで、サイトから送られてきたパターン(url)を開くなら アーティスト、グループが無精査なのでシンボル入れる
    let targetObj;
    if(targetInfo instanceof Object) {
        const targetInfo_copy = copy_object_array(targetInfo);
        myDBget("url",targetInfo_copy["url"])
        .then(res => {
            if(res === undefined){
                targetObj = targetInfo_copy;
                targetObj.artist.unshift(noInvesArtistSymbol);
                targetObj.group.unshift(noInvesGroupSymbol);
                createDiv("url",targetObj);
            }else{
                hikakusuru(targetInfo,res);
            }
        })
    }else{
        // resがundefinedのときは別の処理
        // 検索欄でundefined と 遷移機能でundefinedは処理分ける
        myDBget(targetDivName,targetInfo)
        .then(res => {
            // menuの検索欄からじゃないパターン
            if(res === undefined && ( modoru_rireki[modoru_rireki.length -1].targetDivName !== "menu" )){
                // dataPropertys[targetDivName][0]のプロパティ名 が 唯一わかってる情報targetInfo
                targetObj = {"category" : targetDivName};
                targetObj[dataPropertys[targetDivName][0]] = targetInfo;
                imano_rireki["rirekinokosande"] = true;
                openDiv("create_data",targetObj);
                return null;
            // menuの検索欄からパターン
            }else if(res === undefined && ( modoru_rireki[modoru_rireki.length -1].targetDivName === "menu" )){
                targetObj = {"storeName" : targetDivName , "tegakari" : targetInfo};
                imano_rireki["rirekinokosande"] = true;
                openDiv("all_data",targetObj);
                return null;
            }
            targetObj = res;
            // hozonDataExtract(menuでは使用しない)で使うのでimano_rirekiにオブジェクトいれとく
            imano_rireki["targetObj"] = targetObj;
            createDiv(targetDivName,targetObj);
        })
    }
}


// 画面をつくるやつ
function createDiv(targetDivName,targetObj_moto)
{
    // もとのtargetObj_motoいじると他のやつも変わっちゃってバグる可能性があるかもしれんから、コピー
    const targetObj = copy_object_array(targetObj_moto);

    switch(targetDivName){
        ///////////////////////////////
        // URL DIV
        case "url":
            myLog("URL DIVを作ります","  開くデータ : ",targetObj);
            // タイトル
            document.getElementById("u_name").textContent = targetObj.name;
            document.getElementById("u_name_j").value = targetObj.name_j;
            // ステータス
            const statuss = conversion_status(targetObj.status);
            document.getElementById("u_statusRange").value = statuss["num"];
            document.getElementById("u_statusRange").dispatchEvent(new Event("input"));
            // URL欄
            document.getElementById("u_url").textContent = targetObj.url;
            // Artist欄group欄
            artist_or_gropu_create(targetObj,"artist");
            artist_or_gropu_create(targetObj,"group");
            // 時間欄
            document.getElementById("u_time").textContent = targetObj.time;
            // コメント欄
            const matchTags = targetObj.comment.match(/\$.+?\$/gui);
            if(matchTags !== null){
                for(let i = 0 ; i < matchTags.length ; i++)
                {
                    if(matchTags[i] === "$unfinished$")document.getElementById("u_comment_tag_unfinished").checked = true;
                    if(matchTags[i] === "$anotherone$")document.getElementById("u_comment_tag_anotherone").checked = true;
                    if(matchTags[i] === "$homo$")document.getElementById("u_comment_tag_homo").checked = true;
                }
            }
            document.getElementById("u_comment").value = targetObj.comment.replace(/\$.+\$/gui,"");
            // DifferenceArea欄
            const differenceDiv = document.getElementById("u_difference_area");
            if(targetObj["option_flag"] !== undefined){
                differenceDiv.classList.remove("nodis");
                for(let vv in targetObj["option_flag"])
                {
                    if(!targetObj["option_flag"][vv]) document.getElementById("u_d_"+vv).classList.add("deffLightOn");
                    else document.getElementById("u_d_"+vv).classList.remove("deffLightOn");
                }
                // 遷移機能追加
                differenceDiv.tranInfo = { destinationDIV : "url" , destinationInfo : targetObj["url"] };
                tranmotionIn(differenceDiv);
            }else{
                differenceDiv.classList.add("nodis");
            }

            // ほぞんやでイベントたち
            document.getElementById("u_name_j").addEventListener("input",function(){
                button_double.dispatchEvent(hozonyadeEvent);
            });
            // input eventだと上のステータス設定するところのdispatchEventでこれが発火してだめ
            document.getElementById("u_statusRange").addEventListener("change",function(){
                button_double.dispatchEvent(hozonyadeEvent);
            });
            const checkboxtati = document.getElementById("u_checkboxtati").getElementsByTagName("input");
            for(let i = 0 ; i < checkboxtati.length ; i++)
            {
                checkboxtati[i].addEventListener("change",function(){
                    button_double.dispatchEvent(hozonyadeEvent);
                });
            }

            break;

        ///////////////////////////////
        // Artist DIV  Group DIV
        case "artist":
            myLog("Artist DIVを作ります","  開くデータ : ",targetObj);
            artistDiv_or_groupDiv_create(targetObj,"artist");
            break;

        case "group":
            myLog("Group DIVを作ります","  開くデータ : ",targetObj);
            artistDiv_or_groupDiv_create(targetObj,"group");
            break;

        ///////////////////////////////
        // true_Artist DIV  true_Group DIV
        case "true_artist":
            myLog("True Artist DIVを作ります","  開くデータ : ",targetObj);
            true_artistDiv_or_groupDiv_create(targetObj,"true_artist");
            break;
        case "true_group":
            myLog("True Group DIVを作ります","  開くデータ : ",targetObj);
            true_artistDiv_or_groupDiv_create(targetObj,"true_group");
            break;

        ///////////////////////////////
        // file_Relation DIV
        case "file_relation":
            myLog("file_Relation DIVを作ります","  開くデータ : ",targetObj);
            document.getElementById("f_name").textContent = targetObj["file_name"];
            document.getElementById("f_place").innerHTML = "ファイルの階層&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;&nbsp;<span id='f_place_grade'>" +targetObj["file_place"]+"<span>";
            const place_to_grade = ["","colorgrade_S","colorgrade_A","colorgrade_B","colorgrade_C","colorgrade_D"];
            document.getElementById("f_place_grade").classList.add(place_to_grade[Number(targetObj["file_place"])]);
            document.getElementById("f_comment").value = targetObj["comment"];
            // True_artist True_group共に、true_artist => artist => urlと走査し書き出す
            // SETに入れて重複を確認して作る
            // 動的に生成してるから、開くたびに消去
            const agrelation = document.getElementById("f_kankei_ag");
            const urlrelation = document.getElementById("f_kankei_url");
            agrelation.textContent = null;
            agrelation.innerHTML = "<thead><th>対象</th><th>最終検索日時</th></thead>";
            urlrelation.textContent = null;
            urlrelation.innerHTML = "<thead><th></th><th>名前</th><th>ステータス</th><th>URL</th></thead>";

            const urlnoSet = new Set();
            const dotti_array = ["artist","group"];
            // 先に入れるところ作っとく
            for(let p = 0 ; p<2 ; p++)
            {
                let dotti = dotti_array[p];
                for(let i = 0 ; i < (targetObj["relation_"+dotti].length) ; i++)
                {
                    const tablebody = document.createElement("tbody");
                    tablebody.setAttribute("id","f_"+dotti+i);
                    if(i===0){
                        const uetr = document.createElement("tr");
                        const ue = document.createElement("th");
                        ue.textContent= "True-"+dotti.toUpperCase();
                        ue.setAttribute("colspan",2);
                        uetr.appendChild(ue);
                        tablebody.appendChild(uetr);
                    }
                    const tnametr = document.createElement("tr");
                    const tname = document.createElement("th");
                    tname.textContent = targetObj["relation_"+dotti][i];
                    tname.setAttribute("colspan",2);
                    tnametr.appendChild(tname);
                    tablebody.appendChild(tnametr);
                    // 遷移機能追加
                    tname.tranInfo = { destinationDIV : "true_"+dotti , destinationInfo : targetObj["relation_"+dotti][i] };
                    tranmotionIn(tname);

                    agrelation.appendChild(tablebody);
                }
            }
            // DBアクセスする 今の時間を準備
            const now_timeStamp = (new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }))).getTime();
            let urlkazu = 1;
            for(let p = 0 ; p<2 ; p++)
            {
                let dotti = dotti_array[p];
                for(let i = 0 ; i < targetObj["relation_"+dotti].length ; i++)
                {
                    // まずtrue使ってもとのartist,groupとってくる
                    myDBget(dotti,targetObj["relation_"+dotti][i],dotti+"_true_index")
                    .then(res => {
                        for(let j = 0 ; j < res.length ; j++)
                        {
                            const hako = document.createElement("tr");
                            const hidari_hako = document.createElement("td");
                            const migi_hako = document.createElement("td");
                            hidari_hako.textContent = res[j][dotti+"_name"];
                            migi_hako.textContent = res[j]["last_search"];
                            const last_search_timeStamp = (new Date(res[j]["last_search"])).getTime();;
                            const timeStamp_sa = now_timeStamp - last_search_timeStamp;
                            if(timeStamp_sa > timeLimited[targetObj["file_place"]]){
                                migi_hako.style.color = "salmon";
                            }
                            // 遷移機能追加
                            hako.tranInfo = { destinationDIV : dotti , destinationInfo : res[j][dotti+"_name"] };
                            tranmotionIn(hako);

                            hako.appendChild(hidari_hako);
                            hako.appendChild(migi_hako);
                            document.getElementById("f_"+dotti+i).appendChild(hako);
                            // 取ってきたartist,groupでurlとってくる
                            myDBget("url",res[j][dotti+"_name"],"url_"+dotti+"_index")
                            .then(res => {
                                for(let k = 0 ; k < res.length ; k++)
                                {
                                    if(urlnoSet.has(res[k]["url"])){
                                        continue;
                                    }else {
                                        // アクセスするタイミングがあれしてバグりそう？
                                        urlnoSet.add(res[k]["url"]);
                                        const oohako = document.createElement("tr");
                                        const url_kazu = document.createElement("td");
                                        const url_hako = document.createElement("td");
                                        const name_hako = document.createElement("td");
                                        const status_hako = document.createElement("td");
                                        url_kazu.textContent = urlkazu;
                                        urlkazu++;
                                        url_hako.textContent = res[k]["url"];
                                        if(res[k]["name_j"] === "")name_hako.textContent = res[k]["name"];
                                        else name_hako.textContent = res[k]["name_j"];
                                        status_hako.textContent = conversion_status(res[k]["status"]).mozishort;
                                        status_hako.classList.add(conversion_status(res[k]["status"]).color)
                                        // 遷移機能追加
                                        oohako.tranInfo = { destinationDIV : "url" , destinationInfo : res[k]["url"] };
                                        tranmotionIn(oohako);

                                        oohako.appendChild(url_kazu);
                                        oohako.appendChild(name_hako);
                                        oohako.appendChild(status_hako);
                                        oohako.appendChild(url_hako);
                                        urlrelation.appendChild(oohako);
                                    }
                                }
                            })
                        }
                    })
                }
            }
            
            break;
        
        case "create_data":
            myLog("CreateData DIVを作ります","  開くデータ : ",targetObj);
            const oomoto = document.getElementById("create_data");
            // 保存関数のために、プロパティ設定しとく
            oomoto.category = targetObj.category;

            // 初期化
            oomoto.textContent = null;

            const propertys = dataPropertys[targetObj.category]
            // それぞれのプロパティの入力欄をつくる
            // 特殊コード$t1$とかあったら処理を分ける
            for(let i =0 ; i <propertys.length ; i++)
            {
                const propa_div = document.createElement("div");
                const propa_name = document.createElement("p");
                const propa_data = document.createElement("div");
                const hanteiki = /\$.+\$/gi;
                // もともとデータがあれば、それを最初から入力しておくためのフラグ
                let flagaruka = false;
                let attaData;
                if(targetObj[propertys[i].replace(hanteiki,"")] !== undefined){
                    flagaruka = true;
                    attaData = targetObj[propertys[i].replace(hanteiki,"")];
                }

                if(hanteiki.test(propertys[i]))
                {
                    // t1 : URLのstatus   t2 : artist,groupのgrade   t3 : file_place
                    if((/\$t1\$/gi).test(propertys[i]) || (/\$t2\$/gi).test(propertys[i]) || (/\$t3\$/gi).test(propertys[i])){
                        let moziV;
                        let mozi;
                        let moziN;
                        let moziID;
                        if((/\$t1\$/gi).test(propertys[i])){
                            moziN = "erabustatus";
                        }else if((/\$t2\$/gi).test(propertys[i])){
                            moziN = "erabugrade";
                        }else if((/\$t3\$/gi).test(propertys[i])){
                            moziN = "erabuplace";
                        }
                        for(let j = 1 ; j < 7 ;j++)
                        {
                            let propa_data_radio_waku;
                            if((/\$t1\$/gi).test(propertys[i])){
                                propa_data_radio_waku = document.createElement("div");
                                mozi = conversion_status(j).mozi;
                                moziV = conversion_status(j).motomozi;
                                moziID = "c_radioS"+j;
                            }else if((/\$t2\$/gi).test(propertys[i])){
                                propa_data_radio_waku = document.createElement("div");
                                if(j===2) continue;
                                mozi = conversion_status(j).grade;
                                moziV = conversion_status(j).grade;
                                moziID = "c_radioG"+j;
                            }else if((/\$t3\$/gi).test(propertys[i])){
                                propa_data_radio_waku = document.createElement("span");
                                if(j===6) continue;
                                mozi = j+"";
                                moziV = j+"";
                                moziID = "c_p"+j;
                            }

                            const propa_data_radio = document.createElement("input");
                            const propa_data_label = document.createElement("label");
                            propa_data_radio.setAttribute("type","radio");
                            propa_data_radio.setAttribute("id",moziID);
                            propa_data_radio.setAttribute("name",moziN);
                            propa_data_radio.setAttribute("value",moziV);
                            propa_data_label.setAttribute("for",moziID);
                            propa_data_label.style.userSelect = "none";
                            propa_data_label.textContent = mozi;
                            // 保存のためのクラス設定
                            propa_data_radio.classList.add("saveP_"+propertys[i].replace(hanteiki,""))
                            propa_data_radio.classList.add("saveT_iradio");
                            // ほぞんやでイベント
                            propa_data_radio.addEventListener("change",function(){
                                button_double.dispatchEvent(hozonyadeEvent);
                            });

                            propa_data_radio_waku.appendChild(propa_data_radio);
                            propa_data_radio_waku.appendChild(propa_data_label);
                            propa_data.appendChild(propa_data_radio_waku);

                            if(flagaruka){
                                if(attaData === moziV){
                                    propa_data_radio.checked = true;
                                }
                            }
                        }
                    }else if((/\$h\$/gi).test(propertys[i])){
                        let tukurukazu = 5;
                        if(flagaruka){
                            tukurukazu = attaData.length + 1;
                        }
                        for(let j = 0 ; j < tukurukazu ; j++)
                        {
                            let propa_data_oowaku;
                            let propa_data_hairetu;
                            let keyname = "";
                            if(flagaruka){
                                if(attaData[j] !== undefined) keyname = attaData[j];
                            }
                            if(propertys[i].replace(hanteiki,"") === "relation_artist"){
                                propa_data_oowaku = true_with_select("true_artist",keyname);
                                propa_data_hairetu = propa_data_oowaku.getElementsByTagName("input")[0];
                            }else if(propertys[i].replace(hanteiki,"") === "relation_group"){
                                propa_data_oowaku = true_with_select("true_group",keyname);
                                propa_data_hairetu = propa_data_oowaku.getElementsByTagName("input")[0];
                            }else{
                                propa_data_oowaku = document.createElement("div");
                                propa_data_hairetu = document.createElement("input");
                                propa_data_hairetu.setAttribute("type","text");
                                propa_data_hairetu.setAttribute("spellcheck","false");
                                propa_data_hairetu.value = keyname;
                                propa_data_oowaku.appendChild(propa_data_hairetu);
                            }
                            // 保存のためのクラス設定
                            propa_data_hairetu.classList.add("saveP_"+propertys[i].replace(hanteiki,""))
                            propa_data_hairetu.classList.add("saveT_tokubetu2");
                            // ほぞんやでイベント
                            propa_data_hairetu.addEventListener("input",function(){
                                button_double.dispatchEvent(hozonyadeEvent);
                            });
                            propa_data.appendChild(propa_data_oowaku);
                        }
                    }else if((/\$f\$/gi).test(propertys[i])){
                        let flagname = true;
                        for(let j = 0 ; j < 2 ; j++)
                        {
                            const propa_data_flag = document.createElement("input");
                            const propa_data_label = document.createElement("label");
                            propa_data_flag.setAttribute("type","radio");
                            propa_data_flag.setAttribute("name","attentionfrag");
                            propa_data_flag.setAttribute("value",flagname);
                            propa_data_flag.setAttribute("id","c_flag"+j);
                            propa_data_label.setAttribute("for","c_flag"+j);
                            propa_data_label.style.userSelect = "none";
                            propa_data_label.textContent = (flagname+"").toUpperCase();
                            // 保存のためのクラス設定
                            propa_data_flag.classList.add("saveP_"+propertys[i].replace(hanteiki,""));
                            propa_data_flag.classList.add("saveT_iradio");
                            // ほぞんやでイベント
                            propa_data_flag.addEventListener("change",function(){
                                button_double.dispatchEvent(hozonyadeEvent);
                            });

                            if(flagaruka){
                                if(attaData === flagname){
                                    propa_data_flag.checked = true;
                                }
                            }
                            propa_data.appendChild(propa_data_flag);
                            propa_data.appendChild(propa_data_label);
                            flagname = false;
                        }
                    }else if((/\$kazu\$/gi).test(propertys[i])){
                        const propa_data_textN = document.createElement("input");
                        propa_data_textN.setAttribute("type","number");
                        propa_data_textN.style.width = "5em";
                        // 保存のためのクラス設定
                        propa_data_textN.classList.add("saveP_"+propertys[i].replace(hanteiki,""));
                        propa_data_textN.classList.add("saveT_it");
                        // ほぞんやでイベント
                        propa_data_textN.addEventListener("input",function(){
                            button_double.dispatchEvent(hozonyadeEvent);
                        });

                        if(flagaruka){
                            propa_data_textN.value = attaData;
                        }  
                        propa_data.appendChild(propa_data_textN);
                    }else if((/\$true\$/gi).test(propertys[i])){
                        let keyname = "";
                        if(flagaruka){
                            keyname = attaData;
                        }
                        const propa_data_true = true_with_select(propertys[i].replace(hanteiki,""),keyname);
                        const propa_data_trueText = propa_data_true.getElementsByTagName("input")[0];

                        // 保存のためのクラス設定
                        propa_data_trueText.classList.add("saveP_"+propertys[i].replace(hanteiki,""))
                        propa_data_trueText.classList.add("saveT_it");
                        // ほぞんやでイベント
                        propa_data_trueText.addEventListener("input",function(){
                            button_double.dispatchEvent(hozonyadeEvent);
                        });

                        propa_data.appendChild(propa_data_true);
                    }else{
                        // バグ
                        myError("create_dataDIV作るやつ $ ??? $ のとこでエラー");
                    }
                }else{
                    if(propertys[i]==="comment"){
                        const propa_data_textArea = document.createElement("textarea");
                        propa_data_textArea.setAttribute("cols","25");
                        propa_data_textArea.setAttribute("rows","6");
                        propa_data_textArea.setAttribute("spellcheck","false");
                        propa_data_textArea.style.display = "inline-block";
                        // 保存のためのクラス設定
                        propa_data_textArea.classList.add("saveP_"+propertys[i].replace(hanteiki,""));
                        propa_data_textArea.classList.add("saveT_textArea");
                        // ほぞんやでイベント
                        propa_data_textArea.addEventListener("input",function(){
                            button_double.dispatchEvent(hozonyadeEvent);
                        });

                        if(flagaruka){
                            propa_data_textArea.value = attaData;
                        }     
                        propa_data.appendChild(propa_data_textArea);
                    }else{
                        const propa_data_text = document.createElement("input");
                        propa_data_text.setAttribute("type","text");
                        propa_data_text.setAttribute("spellcheck","false");
                        // 保存のためのクラス設定
                        propa_data_text.classList.add("saveP_"+propertys[i].replace(hanteiki,""));
                        propa_data_text.classList.add("saveT_it");
                        // ほぞんやでイベント
                        propa_data_text.addEventListener("input",function(){
                            button_double.dispatchEvent(hozonyadeEvent);
                        });

                        if(flagaruka){
                            propa_data_text.value = attaData;
                        }  
                        propa_data.appendChild(propa_data_text);
                    }                    
                }
                propa_name.textContent = propertys[i].replace(hanteiki,"");
                propa_div.appendChild(propa_name);
                propa_div.appendChild(propa_data);
                oomoto.appendChild(propa_div);
            }
            break;
        
        case "all_data":
            myLog("AllData DIVを作ります","  開くデータ : ",targetObj);
            // all_data DIVはopenDIVするたびに消してる（重いかもだから）から、ここではしなくておｋ
            document.getElementById("all_nani").textContent = targetObj.storeName.toUpperCase();
            // 手がかりがあり、URL,Artist,Groupなら手がかりエリアになんか入れる
            if(targetObj.tegakari !== "") {
                if(targetObj.storeName === "url" || targetObj.storeName === "artist" || targetObj.storeName === "group"){
                    restrictOpen(targetObj.storeName,document.getElementById("all_tegakari"),targetObj.tegakari);
                    document.getElementById("all_tegakari_p").textContent = "近いデータ";
                    document.getElementById("all_fulldata_p").style.marginTop = "16px";
                }
            }
            fullOpen(targetObj.storeName,document.getElementById("all_fulldata"));
            break;

        case "all_file_status":
            myLog("AllFileStatus DIVを作ります","  開くデータ : ",targetObj);

            document.getElementById("allfile_kind").textContent = "";
            document.getElementById("allfile_kind").textContent = conversion_status(targetObj.hiraku_status).mozi;

            // 下の部分の初期化は openDIVするたびに消してる（重いかもだから）から、ここではしなくておｋ
            myDBget("url",targetObj.hiraku_status,"url_status_index")
            .then(res => {
                document.getElementById("allfile_kazu").textContent = res.length;
                const oowaku = document.getElementById("allfile_table")
                const flag = document.createDocumentFragment();
                for(let i = 0 ; i < res.length ; i++)
                {
                    const waku = document.createElement("tr");
                    const td_no = document.createElement("td");
                    const td_name = document.createElement("td");
                    const td_name_j = document.createElement("td");
                    const td_url = document.createElement("td");
                    td_no.textContent = i+1;
                    td_name.textContent = res[i].name;
                    td_name_j.textContent = res[i].name_j;
                    td_url.textContent = res[i].url;
                    waku.appendChild(td_no);
                    waku.appendChild(td_name);
                    waku.appendChild(td_name_j);
                    waku.appendChild(td_url);
                    // 遷移機能追加
                    waku.tranInfo = {destinationDIV:"url",destinationInfo:res[i].url};
                    tranmotionIn(waku);

                    flag.appendChild(waku);
                }
                oowaku.appendChild(flag);
            })
            break;

        case "rireki":
            myLog("Rireki DIVを作ります","  開くデータ : ",targetObj);

            break;
        
        default :
            myError("エラー : createDivメソッドでのエラー(targetDIVが無いです)");
            break;
    }
}

// URLDIVのArtist欄group欄をつくるやつP
function artist_or_gropu_create(targetObj,dotti)
{
    let noInvesSymbol;
    if(dotti === "artist"){
        noInvesSymbol = noInvesArtistSymbol;
    }else if (dotti === "group"){
        noInvesSymbol = noInvesGroupSymbol;
    }
    const tabledesu = document.getElementById("u_"+dotti);
    // appendChildで動的に生成してるから、開くたびに消去しとかなあかん
    tabledesu.textContent = null;

    for(let i = 0 ; i < targetObj[dotti].length ; i++)
    {
        const hako = document.createElement("tr");
        let hidari_hako;
        let migi_hako;
        let grade_hako;
        const hidari_hako_radio = document.createElement("input");
        hidari_hako_radio.setAttribute("type","radio");
        hidari_hako_radio.setAttribute("name","hosi_"+dotti);
        // ほぞんやでイベント
        hidari_hako_radio.addEventListener("input",function(){
            button_double.dispatchEvent(hozonyadeEvent);
        });

        if(i===0){
            if(targetObj[dotti][0] !== noInvesSymbol){
                hidari_hako = document.createElement("th");
                migi_hako = document.createElement("th");
                grade_hako = document.createElement("th");
                hidari_hako.appendChild(hidari_hako_radio);
                hidari_hako_radio.checked = true;
            }else{
                continue;
            }
        }else{
            hidari_hako = document.createElement("td");
            migi_hako = document.createElement("td");
            grade_hako = document.createElement("td");
            hidari_hako.appendChild(hidari_hako_radio);
        }
        hidari_hako.addEventListener("click",function(){
            hidari_hako_radio.checked = true;
        });

        // 保存機能のため、migi_hakoにhidari_hakoのcheckboxいれとく
        migi_hako.linkC = hidari_hako_radio;

        myDBget(dotti,targetObj[dotti][i])
        .then( res => {
            let truename = "";

            // 遷移機能追加
            migi_hako.tranInfo = {destinationDIV:dotti,destinationInfo:targetObj[dotti][i]};
            tranmotionIn(migi_hako);

            if(res === undefined){
                truename = "--登録なし--";
                migi_hako.innerHTML = '<span class="saveP_'+dotti+' saveT_tokubetu1">'+targetObj[dotti][i]+"</span><br>  ==>『 "+truename+" 』";
            }else{
                truename = res["true_"+dotti];
                migi_hako.innerHTML = '<span class="saveP_'+dotti+' saveT_tokubetu1">'+targetObj[dotti][i]+"</span><br>  ==>『 "+truename+" 』";
                const attention = res["attention"];


                myDBget("true_"+dotti,truename)
                .then(res => {
                    let grade = "";
                    if(res === undefined){
                        // true名がartist,groupに入力されてるのに、true_artist,true_groupには無いパターン（普通はそんなことない）
                        grade = "？？"
                    }else{
                        grade = res.grade;
                        grade_hako.classList.add("colorgrade_"+grade);
                    }
                    // attention trueなら ! いれとく
                    if(attention){
                        grade_hako.innerHTML = grade+'<img src="images/attention.png" class="sankakuO">';
                    }else{
                        grade_hako.textContent = grade;
                    }
                })
            }
            // あとは全部入力、appendする
            hako.appendChild(hidari_hako);
            hako.appendChild(migi_hako);
            hako.appendChild(grade_hako);
            tabledesu.appendChild(hako);
        })
    }
}

// ArtistDIV GroupDIVをつくるやつ
function artistDiv_or_groupDiv_create(targetObj,dotti)
{
    let dotti_short;
    if(dotti === "artist") dotti_short="a_";
    if(dotti === "group") dotti_short="g_";
    document.getElementById(dotti_short+"name").textContent = targetObj[dotti+"_name"];
    myDBget("true_"+dotti,targetObj["true_"+dotti])
    .then(res => {
        let grade = "";
        if(res === undefined){
            // アーティスト、グループにtrue名のデータあるけど、DBにTrue名が無いパターン（普通はそんなことない）
            grade = "？？";
        }else{
            grade = res.grade;
        }
        document.getElementById(dotti_short+"true_name_grade").textContent = grade;
        document.getElementById(dotti_short+"true_name_grade").classList.add("colorgrade_"+grade);
    })
    document.getElementById(dotti_short+"true_name").textContent = targetObj["true_"+dotti];

    // 遷移機能追加
    document.getElementById(dotti_short+"true_name").tranInfo = {destinationDIV : "true_"+dotti, destinationInfo :targetObj["true_"+dotti]};
    tranmotionIn(document.getElementById(dotti_short+"true_name"));

    if(targetObj["attention"]){
        document.getElementById(dotti_short+"attention").classList.add("sankakuO");
        document.getElementById(dotti_short+"attention").classList.remove("sankakuX");
    }
    document.getElementById(dotti_short+"last_search").textContent = targetObj["last_search"];
    document.getElementById(dotti_short+"last_index").value = targetObj["last_index"];

    // ほぞんやで　イベント発行
    document.getElementById(dotti_short+"last_index").addEventListener("input",function(){
        button_double.dispatchEvent(hozonyadeEvent);
    });

    document.getElementById(dotti_short+"comment").value = targetObj["comment"];

    const urlnotoko = document.getElementById(dotti_short+"urlnotoko");
    // appendChildで動的に生成してるから、開くたびに初期化
    urlnotoko.textContent = null;
    urlnotoko.innerHTML = "<tr><th></th><th>URL</th><th>ステータス</th></tr>";

    myDBget("url",targetObj[dotti+"_name"],"url_"+dotti+"_index")
    .then(res => {
        if(res === undefined){
            // アーティスト、グループにあるけど、URL１個も無いパターン（普通はそんなことない）

        }else{
            for(let i = 0 ; i < res.length ; i++)
            {
                const urlnotoko_tr = document.createElement("tr");
                const kazunotoko = document.createElement("td");
                const urlnotoko_hidari = document.createElement("td");
                const urlnotoko_migi = document.createElement("td");
                kazunotoko.textContent = i+1;
                urlnotoko_hidari.textContent = res[i]["url"];
                // 遷移機能追加
                urlnotoko_tr.tranInfo = {destinationDIV : "url", destinationInfo : res[i]["url"]};
                tranmotionIn(urlnotoko_tr);

                urlnotoko_migi.textContent = conversion_status(res[i]["status"]).mozishort;
                urlnotoko_migi.classList.add(conversion_status(res[i]["status"]).color)
                urlnotoko_tr.appendChild(kazunotoko);
                urlnotoko_tr.appendChild(urlnotoko_hidari);
                urlnotoko_tr.appendChild(urlnotoko_migi);
                urlnotoko.appendChild(urlnotoko_tr);
            }
        }
    })
}

// True ArtistDIV GroupDIVをつくるやつ
function true_artistDiv_or_groupDiv_create(targetObj,dotti)
{
    let dotti_short;
    let dotti_dbname;
    if(dotti === "true_artist") {dotti_short="ta_";dotti_dbname="artist";}
    if(dotti === "true_group") {dotti_short="tg_";dotti_dbname="group";}
    document.getElementById(dotti_short+"name").textContent = targetObj[dotti+"_name"];
    document.getElementById(dotti_short+"name").classList.add("colorgrade_"+targetObj["grade"]);
    document.getElementById(dotti_short+"grade").textContent = targetObj["grade"];
    document.getElementById(dotti_short+"grade").classList.add("colorgrade_"+targetObj["grade"]);
    document.getElementById(dotti_short+"comment").value = targetObj["comment"];
    const file_kankei = document.getElementById(dotti_short+"file");
    const kobetunotoko = document.getElementById(dotti_short+"kobetu");
    // appendChildで動的に生成してるから、開くたびに初期化
    file_kankei.textContent = null;
    kobetunotoko.textContent = null;
    kobetunotoko.innerHTML = "<tr><th>検索名</th><th>最終検索日時</th></tr>";

    myDBget("file_relation",targetObj[dotti+"_name"],"file_"+dotti+"_index")
    .then(res => {
        if(res === undefined){
            // TRUE アーティスト、TRUE グループにあるけど、ファイル１個も無いパターン（普通はそんなことない）
        }else{
            for(let i = 0 ; i < res.length ; i++)
            {
                const file_kankeid = document.createElement("div");
                const file_kankeip = document.createElement("p");
                file_kankeip.textContent = "▶ "+res[i]["file_name"];
                // 遷移機能追加
                file_kankeid.tranInfo = {destinationDIV : "file_relation", destinationInfo : res[i]["file_name"]};
                tranmotionIn(file_kankeid);

                file_kankeid.appendChild(file_kankeip);
                file_kankei.appendChild(file_kankeid);
            }
        }
    });

    myDBget(dotti_dbname,targetObj[dotti+"_name"],dotti_dbname+"_true_index")
    .then(res => {
        if(res === undefined){
            // TRUE アーティスト、TRUE グループにあるけど、個別１個も無いパターン（普通はそんなことない）

        }else{
            for(let i = 0 ; i < res.length ; i++)
            {
                const namenotoko_tr = document.createElement("tr");
                const namenotoko_hidari = document.createElement("td");
                const namenotoko_migi = document.createElement("td");
                // 遷移機能追加
                namenotoko_tr.tranInfo = {destinationDIV : dotti_dbname, destinationInfo : res[i][dotti_dbname+"_name"]};
                tranmotionIn(namenotoko_tr);

                namenotoko_hidari.textContent = res[i][dotti_dbname+"_name"];
                namenotoko_migi.textContent = res[i]["last_search"];
                namenotoko_tr.appendChild(namenotoko_hidari);
                namenotoko_tr.appendChild(namenotoko_migi);
                kobetunotoko.appendChild(namenotoko_tr);
            }
        }
    });
}

// Create_data の true系のセレクト付きつくるやつ
function true_with_select(propa,keyname)
{
    const oowaku = document.createElement("div");
    const kakutoko = document.createElement("input");
    kakutoko.setAttribute("type","text");
    kakutoko.setAttribute("spellcheck","false");
    kakutoko.style.marginRight = "20px";
    const erabutoko = document.createElement("select");
    const erabutoko_no1 = document.createElement("option");
    erabutoko_no1.textContent = "←手入力 or 選ぶ↓";
    erabutoko_no1.setAttribute("selected","selected");
    erabutoko_no1.setAttribute("value","");
    erabutoko.appendChild(erabutoko_no1);
    oowaku.appendChild(kakutoko);
    oowaku.appendChild(erabutoko);
    erabutoko.addEventListener("change",function(){
        if(erabutoko.value !== "") {
            kakutoko.value = erabutoko.value;
            button_double.dispatchEvent(hozonyadeEvent);
        }
    });

    const openReq = indexedDB.open(dbName);
    openReq.onsuccess = function(event){
        const db = event.target.result;
        const transaction = db.transaction(propa,"readonly");
        const store = transaction.objectStore(propa);
        const getRequest = store.getAll();
        getRequest.onsuccess = function(event2){
            for(let i = 0 ; i < getRequest.result.length ; i++)
            {
                const erabutoko_ato = document.createElement("option");
                erabutoko_ato.setAttribute("value",getRequest.result[i][propa+"_name"]);
                if(getRequest.result[i][propa+"_name"] === keyname) {
                    kakutoko.value = getRequest.result[i][propa+"_name"];
                    erabutoko_ato.setAttribute("selected","selected");
                }
                erabutoko_ato.textContent=(i+1+"").padStart(3,"0")+" : "+getRequest.result[i][propa+"_name"];
                erabutoko.appendChild(erabutoko_ato);
            }
            db.close();
        }
    }
    return oowaku;
}


// URLのようにエントリ数がめっちゃ多くなると固まる
// だいたい８万～１０万ぐらいが限界か？もし将来そうなったら、ページわけとかしなあかん
function fullOpen(storeName,tukerutoko,hanni1,hanni2)
{
    const tableHead = {
        "url":          [{"key":"no","mitame":""} , {"key":"url","mitame":"URL"} , {"key":"status","mitame":"ステータス"}],
        "artist":       [{"key":"no","mitame":""} , {"key":"artist_name","mitame":"名前"}],
        "group":        [{"key":"no","mitame":""} , {"key":"group_name","mitame":"名前"}],
        "true_artist":  [{"key":"no","mitame":""} , {"key":"true_artist_name","mitame":"名前"} , {"key":"grade","mitame":"グレード"}],
        "true_group":   [{"key":"no","mitame":""} , {"key":"true_group_name","mitame":"名前"} , {"key":"grade","mitame":"グレード"}],
        "file_relation":[{"key":"no","mitame":""} , {"key":"file_name","mitame":"名前"} , {"key":"file_place","mitame":"ランク"}]
    }
    // file_relation用の処理 フラグエレメント準備
    const file_relation_frag =[];
    let now_timeStamp;
    if(storeName === "file_relation"){
        // i=４まででいい、けどダミーデータがgrade１～９まであるのでいちおう１０個つくっとく
        for(let i = 0 ; i < 9 ; i++)
        {
            const flag = document.createDocumentFragment();
            file_relation_frag[i] = flag;
        }
        now_timeStamp = (new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }))).getTime();
    }

    const oowaku = document.createElement("table");
    const waku_head = document.createElement("tr");
    const imano_tableHead = tableHead[storeName];
    for(let i = 0 ; i < imano_tableHead.length ; i++)
    {
        const headtati = document.createElement("th");
        headtati.textContent = imano_tableHead[i]["mitame"];
        waku_head.appendChild(headtati);
    }
    oowaku.appendChild(waku_head);

    const fulldata_kazu = document.getElementById("all_fulldata_kazu")
    const openReq = indexedDB.open(dbName);
    openReq.onsuccess = function(event){
        const db = event.target.result;
        const transaction = db.transaction(storeName,"readonly");
        const store = transaction.objectStore(storeName);
        let getRequest;
        if(hanni1 !== undefined){
            getRequest = store.getAll(IDBKeyRange.bound(hanni1, hanni2));
        }else{
            getRequest = store.getAll();
        }

        getRequest.onsuccess = function(event2){
            // データがおすぎると固まるのでやめる
            if(getRequest.result.length > 80000) {
                myError("FullOpen データ量が多すぎます!");
                return null;
            }
            fulldata_kazu.textContent = " : " + getRequest.result.length;
            fulldata_kazu.kazu = getRequest.result.length;

            for(let i = 0 ; i < getRequest.result.length ; i++)
            {
                const waku = document.createElement("tr");
                for(let j = 0 ; j < imano_tableHead.length ; j++)
                {
                    const nakami = document.createElement("td");
                    // keyのところがnoの場合はNoとして数字をいれるだけ
                    if(imano_tableHead[j]["key"] === "no")nakami.textContent = i+1;
                    else nakami.textContent = getRequest.result[i][imano_tableHead[j]["key"]];

                    // j=1の２番目の要素が遷移機能をつける要素
                    if(j===1){
                        // 遷移機能追加
                        nakami.tranInfo = {destinationDIV : storeName, destinationInfo : getRequest.result[i][imano_tableHead[j]["key"]]};
                        tranmotionIn(nakami);
                    }

                    // file_relation用の特殊動作
                    if(storeName === "file_relation"){
                        if(j===0){
                            // 並び変えようにクラスいれとく
                            nakami.classList.add("file_relation_tokubetu");

                        }else if(j===1){
                            // グレードと時間のあれ
                            const dotti = ["artist","group"];
                            for(let k = 0 ; k < 2 ; k++)
                            {
                                for(let l = 0 ; l < getRequest.result[i]["relation_"+dotti[k]].length ; l++)
                                {
                                    const sagasuyatu = getRequest.result[i]["relation_"+dotti[k]][l];
                                    myDBget(dotti[k],sagasuyatu,dotti[k]+"_true_index")
                                    .then(res => {
                                        if(res.length === 0){
                                            // なにもデータなし　普通はこんなことない
                                            nakami.style.color = "black";
                                        }else{
                                            for(let m = 0 ; m < res.length ; m++)
                                            {
                                                // 適当につくったダミーデータは１～９までgradeあるから対策 まあそもそもダミーはres.length === 0 で弾かれてるはず
                                                if(getRequest.result[i]["grade"] > 5) continue;

                                                if(now_timeStamp - (new Date(res[m]["last_search"]).getTime()) > timeLimited[getRequest.result[i]["file_place"]]){
                                                    nakami.style.color = "salmon";
                                                }
                                            }
                                        }
                                    });
                                }
                            }

                        }else if(j===2){
                            // 並び変えようにプロパティいれとく
                            waku.ranked = getRequest.result[i][imano_tableHead[j]["key"]];
                        }
                    }

                    waku.appendChild(nakami);
                }

                // file_relation用の特殊動作 並び変えよう
                if(storeName === "file_relation"){
                    file_relation_frag[Number(waku.ranked) - 1].appendChild(waku);
                }else{
                    oowaku.appendChild(waku);
                }
            }

            // file_relation用の特殊動作 並び変えようのフラグメントをいれてく
            if(storeName === "file_relation"){
                for(let i = 0 ; i < file_relation_frag.length ; i++)
                {
                    oowaku.appendChild(file_relation_frag[i]);
                }
                const kazukaeru = document.getElementById("all_fulldata").getElementsByClassName("file_relation_tokubetu");
                (function matu(){
                    let nokazu = 0;
                    setTimeout(function(){
                        if(kazukaeru.length === fulldata_kazu.kazu){
                            for(let i = 0 ; i < kazukaeru.length ; i++)
                            {
                                nokazu++;
                                kazukaeru[i].textContent = nokazu;
                            }
                        }else{
                            matu(); 
                        }
                    },1)
                })();
            }
            
            tukerutoko.appendChild(oowaku);
            db.close();
        }
    }

}
// 全データ表示じゃなくて、tegakari近辺のデータを表示するところ
function restrictOpen(storeName,tukerutoko,tegakari)
{
    const hanni1 = String.fromCodePoint(tegakari.codePointAt()-1) + tegakari.substring(1);
    const hanni2 = String.fromCodePoint(tegakari.codePointAt()+1) + tegakari.substring(1);
    fullOpen(storeName,tukerutoko,hanni1,hanni2);
}


// URLの比較するやつ
function hikakusuru(targetObj_moto,db_targetObj)
{
    // もとのtargetObj_motoいじると履歴のやつも変わっちゃってバグるからコピー
    const targetObj = copy_object_array(targetObj_moto);

    const flag_zenbu = {}
    flag_zenbu["flag_name"] = targetObj.name === db_targetObj.name;
    flag_zenbu["flag_time"] = targetObj.time === db_targetObj.time;
    // name_j は なにか送られてきてたら比較する　なにも来てなかったらtrueで
    if(targetObj.name_j !== ""){
        flag_zenbu["flag_name_j"] = targetObj.name_j === db_targetObj.name_j;
    }else{
        flag_zenbu["flag_name_j"] = true;
    }

    // artist group 順番は関係なく、名前が同じかしらべる
    const dotti = ["artist","group"];
    let nametati;
    for(let i = 0 ; i < dotti.length ; i++)
    {
        nametati = "";
        for(let j = 0 ; j < targetObj[dotti[i]].length ; j++)
        {
            nametati += targetObj[dotti[i]][j];
        }
        for(let j = 0 ; j < db_targetObj[dotti[i]].length ; j++)
        {
            nametati = nametati.replace(db_targetObj[dotti[i]][j],"");
        }
        if(nametati === ""){
            flag_zenbu["flag_"+dotti[i]] = true;
        }else {
            flag_zenbu["flag_"+dotti[i]] = false;
        }
    }

    for(let vv in flag_zenbu)
    {
        // 1個でもfalseあればoption_flagにいれて送る
        // アーティスト、グループの順番をええかんじにする
        if(flag_zenbu[vv] === false)
        {
            targetObj["option_flag"] = flag_zenbu;
            for(let i = 0 ; i < dotti.length ; i++)
            {
                let newHairetu = [];
                let hairetuNo = 1;
                for(let j = 0 ; j < targetObj[dotti[i]].length ; j++)
                {
                    if(targetObj[dotti[i]][j] === db_targetObj[dotti[i]][0]){
                        newHairetu[0] = targetObj[dotti[i]][j];
                        continue;
                    }
                    newHairetu[hairetuNo] = targetObj[dotti[i]][j];
                    hairetuNo++;
                }
                if(newHairetu[0] === undefined){
                    if(dotti[i] === "artist")newHairetu[0] = noInvesArtistSymbol;
                    else if(dotti[i] === "group")newHairetu[0] =noInvesGroupSymbol;
                }
                targetObj[dotti[i]] = newHairetu;
            }
            createDiv("url",targetObj);
            return null;
        }
    }
    // 全部trueだったら、DBの内容で作る
    createDiv("url",db_targetObj);
}



//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
// Messageのところ


function messageListenOn()
{
    window.addEventListener("message",function(e){
        console.log("message kimasita : ",e.origin);



    });
}











