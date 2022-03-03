"use strict"

console.log("info!");

const timeWatch = true;
const dbName = 'myDB';
const datasfilediv = "./datas"
const datanames = {url:"url",artist:"artist",group:"group",true_artist:"true_artist",true_group:"true_group",file_relation:"file_relation"};
let imano_rireki = {targetDivName:"menu",targetInfo:""};
const modoru_rireki = [];
const susumu_rireki = [];
const noInvesArtistSymbol = Symbol("noInvesArtist");
const noInvesGroupSymbol = Symbol("noInvesGroupSymbol");
const dataPropertys ={
    url:            ["url","name","name_j","$h$artist","$h$group","$t1$status","time","comment"],
    artist:         ["artist_name","true_artist","last_search","last_index","comment","$f$attention"],
    group:          ["group_name","true_group","last_search","last_index","comment","$f$attention"],
    true_artist:    ["true_artist_name","$t2$grade","comment"],
    true_group:     ["true_group_name","$t2$grade","comment"],
    file_relation:  ["file_name","file_place","$h$relation_artist","$h$relation_group","comment"]
}



// 一番最初DBないときファイルからDBつくる
if(localStorage.getItem("databaseFlag") === null){
    console.log('---DB初期処理---');
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
                console.log('---upgrage処理---');
                const db = event.target.result;
                const store_url = db.createObjectStore(datanames["url"], {keyPath: 'url'});
                store_url.createIndex('url_artist_index', 'artist',{multiEntry:true});
                store_url.createIndex('url_group_index', 'group',{multiEntry:true});

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
                for(let i = 0 ; i < ireruyatu.length ; i++)
                {
                    const req = store.add(ireruyatu[i]);
                    if(xx === "url" && i%500 ===0){
                        req.onsuccess = function(){
                            console.log("DBputログ 入れた数 => ",+i);
                        }
                    }

                }
                transaction.oncomplete =function(){
                    if(xx === "url" && timeWatch)console.timeEnd("時間計測---ファイルからDBへ : url");
                }
                transaction.onerror = function(){
                    console.log("DBつくるやつでなんかエラー出たで");
                }
                db.close();
            }
        })
    }
    localStorage.setItem("databaseFlag","false")
}

if(document.readyState !== "loading") {
    console.log("read終わってた");
    main();
    } else {
    console.log("read終わってなかった");
    document.addEventListener("DOMContentLoaded", main, false);
}


function main(){
    
    // 戻るボタン
    const button_move_back = document.getElementById("move_back");
    button_move_back.addEventListener("click",function(event){
        const modorisaki = modoru_rireki.pop();
        if(modorisaki === undefined){
            // 戻り先なし、最初のメニューまでもどった
        }else{
            
            openDiv(modorisaki.targetDivName,modorisaki.targetInfo,true);
        }
    },false);




    // リセットボタン
    const button_resetbtn = document.getElementById("reset");
    button_resetbtn.addEventListener("click",function(event){
        openDiv("create_data",{category:"artist"});
    },false);
    

    // メニューボタン
    const button_menubtn = document.getElementById("gohome");
    button_menubtn.addEventListener("click",function(event){
        openDiv("menu","");
    },false);






    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // メニュー欄の構築
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
    // 履歴欄を表示非表示できるように
    const menu_history_p =document.getElementById("m_historyonoffp");
    menu_history_p.addEventListener("click",function(){
        document.getElementById("m_historyonoffdiv").classList.toggle("nodis");
    });
    // DB保存ボタン
    const btnDBsave = document.getElementById("m_DBsave");
    btnDBsave.addEventListener("click",function(){
        if(timeWatch)console.time("時間計測---ファイルからDBへ : url")
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
                        console.log(res);
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
            console.log("DBdelete完了");
            localStorage.removeItem("databaseFlag");
        };
        deleteRequest.onerror = function(event){
            console.log("DBdelete失敗error :",event.target.error);
        };
    }); 
    
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    // URL欄の構築
    // ステータスを設定できるバーつくる
    const u_statusRange = document.getElementById("u_statusRange");
    const u_status = document.getElementById("u_status");
    u_statusRange.addEventListener("input",function(){
        const status_now = conversion_status(Number(u_statusRange.value));
        u_status.innerHTML = "<b>"+status_now["mozi"]+"</b>";
        u_status.className = status_now["color"];
    });

    

    
    
    window.addEventListener("message",function(e){
        console.log("message kimasita : ",e.origin);
        const ee = document.getElementById("menu");
        const eee = this.document.getElementById("info");
        ee.classList.toggle("nodis")
        eee.classList.toggle("nodis")
    });

}    



//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
// Functionのところ

// MyError
function myError(ss){
    console.error(ss);
}

// DBからオブジェクト取ってくるFanction Promiseで返す indexnameにインデックス名入れるとindexでとってくる（この場合はgetAllなので配列でかえる)
async function myDBget(storeName,id,indexname){
    return new Promise((resolve,reject) => {
        const openReq = indexedDB.open(dbName);
        openReq.onsuccess = function(event){
            const db = event.target.result;
            const store = db.transaction(storeName,"readonly").objectStore(storeName);
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
    }
}

// DIV遷移機能をつけるやつ
// 遷移情報はtargetInfoってプロパティのオブジェクトdestinationDIV,destinationInfoにある
// 同じ
function tranmotionIn(targetElement)
{
    targetElement.onclick =function(event){
        if(event.ctrlKey){
            openDiv(targetElement.tranInfo.destinationDIV,targetElement.tranInfo.destinationInfo)
        }
    }
}


// 指定したdiv要素targetDivName を　指定した指標(key) targetInfo　で開く
function openDiv(targetDivName,targetInfo,rirekioption)
{
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
    if(rirekioption || imano_rireki === null){

    }else{
        modoru_rireki.push(imano_rireki);
    }
    imano_rireki = { targetDivName : targetDivName , targetInfo : targetInfo };
    if(targetDivName === "create_data") {
        imano_rireki =null;
        createDiv(targetDivName,targetInfo);
        return null;
    }
    

    // targetDIVがmenuならtargetInfo関係ないのでここで終わり
    if(targetDivName === "menu") return null;

    // targetInfoに最初からオブジェクトが入ってた場合、サイトから送られてきたパターン(url)ならアーティスト、グループが無精査なのでシンボル入れる
    let targetObj;
    if(targetInfo instanceof Object) {
        targetObj = targetInfo;
        targetObj.artist.unshift(noInvesArtistSymbol);
        targetObj.group.unshift(noInvesGroupSymbol);
        createDiv(targetDivName,targetObj);
    }else{
        // resがundefinedのときは別の処理をあとで考える
        myDBget(targetDivName,targetInfo)
        .then(res => {
            targetObj = res;
            createDiv(targetDivName,res);
        })
    }
}


// 画面をつくるやつ
function createDiv(targetDivName,targetObj)
{
    console.log("開くDIV : ",targetDivName,"   開くデータ : ",targetObj);
    switch(targetDivName){
        ///////////////////////////////
        // URL DIV
        case "url":
            console.log("URL DIVを作ります");
            // タイトル
            document.getElementById("u_name").textContent = targetObj.name;
            document.getElementById("u_name_j").value = targetObj.name_j;
            // ステータス
            const statuss = conversion_status(targetObj.status);
            document.getElementById("u_statusRange").value = statuss["num"];
            document.getElementById("u_statusRange").dispatchEvent(new Event("input"));
            // URL欄
            document.getElementById("u_url").value = targetObj.url;
            // Artist欄group欄
            artist_or_gropu_create(targetObj,"artist");
            artist_or_gropu_create(targetObj,"group");
            // 時間欄
            document.getElementById("u_time").textContent = "投稿日時  :  "+targetObj.time;
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
            break;

        ///////////////////////////////
        // Artist DIV  Group DIV
        case "artist":
            console.log("Artist DIVを作ります");
            artistDiv_or_groupDiv_create(targetObj,"artist");
            break;

        case "group":
            console.log("Group DIVを作ります");
            artistDiv_or_groupDiv_create(targetObj,"group");
            break;

        ///////////////////////////////
        // true_Artist DIV  true_Group DIV
        case "true_artist":
            console.log("True Artist DIVを作ります");
            true_artistDiv_or_groupDiv_create(targetObj,"true_artist");
            break;
        case "true_group":
            console.log("True Group DIVを作ります");
            true_artistDiv_or_groupDiv_create(targetObj,"true_group");
            break;

        ///////////////////////////////
        // file_Relation DIV
        case "file_relation":
            console.log("file_Relation DIVを作ります");
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
            // DBアクセスする
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
            console.log("CreateData DIVを作ります");
            const oomoto = document.getElementById("create_data");
            const propertys = dataPropertys[targetObj.category]
            console.log(propertys);
            // それぞれのプロパティの入力欄をつくる
            // 特殊コード$t1$とかあったら処理を分ける
            for(let i =0 ; i <propertys.length ; i++)
            {
                const propa_div = document.createElement("div");
                const propa_name = document.createElement("p");
                const propa_data = document.createElement("div");
                const hanteiki = /\$.+\$/gi;
                if(hanteiki.test(propertys[i]))
                {
                    if((/\$t1\$/gi).test(propertys[i])){
                        for(let j = 1 ; j < 7 ;j++)
                        {
                            const propa_data_radio = document.createElement("span");
                            propa_data_radio.innerHTML ='<input type="radio" id="c_radioS'+j+'" name="erabustatus" value="'+conversion_status(j).motomozi+'"> <label for="c_radioS'+j+'" style="user-select: none;">'+conversion_status(j).mozi+'</label>';
                            propa_data.appendChild(propa_data_radio);
                        }
                    }else if((/\$t2\$/gi).test(propertys[i])){
                        for(let j = 1 ; j < 7 ;j++)
                        {
                            if(j===2)continue;
                            const propa_data_grade = document.createElement("span");
                            propa_data_grade.innerHTML ='<input type="radio" id="c_radioG'+j+'" name="erabudrade" value="grade-'+conversion_status(j).grade+'"> <label for="c_radioG'+j+'" style="user-select: none;">'+conversion_status(j).grade+'</label>';
                            propa_data.appendChild(propa_data_grade);
                        }
                    }else if((/\$h\$/gi).test(propertys[i])){
                        for(let j = 0 ; j < 5 ; j++)
                        {
                            const propa_data_hairetu = document.createElement("span");
                            propa_data_hairetu.innerHTML ='<input type="text">';
                            propa_data_hairetu.style.marginRight = "10px";
                            propa_data.appendChild(propa_data_hairetu);
                        }
                    }else if((/\$f\$/gi).test(propertys[i])){
                        propa_data.innerHTML = '<input type="radio" id="c_ffalse" name="attentionfrag" value="false"> <label for="c_ffalse" style="user-select: none;">FALSE  </label><input type="radio" id="c_ftrue" name="attentionfrag" value="true"> <label for="c_ftrue" style="user-select: none;">TRUE</label>'
                    }else{
                        // バグ
                        myError("create_dataのとこでエラー");
                    }
                }else{
                    if(propertys[i]==="comment"){
                        propa_data.innerHTML = '<textarea cols="25" rows="6" style="display: inline-block;" id="u_comment"></textarea>';
                    }else{
                        const propa_data_text = document.createElement("input");
                        propa_data_text.setAttribute("type","text");
                        propa_data.appendChild(propa_data_text);
                    }                    
                }
                propa_name.textContent = propertys[i].replace(hanteiki,"");
                propa_div.appendChild(propa_name);
                propa_div.appendChild(propa_data);
                oomoto.appendChild(propa_div);
            }

            break;

        default :
            console.log("エラー : createDivメソッドでのエラーです");
            break;
    }
}

// URLDIVのArtist欄group欄をつくるやつ
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
        if(i===0){
            if(targetObj.artist[0] !== noInvesSymbol){
                hidari_hako = document.createElement("th");
                migi_hako = document.createElement("th");
                grade_hako = document.createElement("th");
                hidari_hako.textContent = "★";
                hidari_hako.style.color = "yellow";
            }else{
                continue;
            }
        }else{
            hidari_hako = document.createElement("td");
            migi_hako = document.createElement("td");
            grade_hako = document.createElement("td");
        }

        myDBget(dotti,targetObj[dotti][i])
        .then( res => {
            let truename = "";
            if(res === undefined){
                truename = "--登録なし--";
            }else{
                truename = res["true_"+dotti];
                migi_hako.innerHTML = targetObj[dotti][i]+"<br>   ⇒"+'<input type ="text" size = 22 value='+truename+'>';

                // 遷移機能追加
                migi_hako.tranInfo = {destinationDIV:dotti,destinationInfo:targetObj[dotti][i]};
                tranmotionIn(migi_hako);

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
                    // あとは全部入力、appendする
                    grade_hako.textContent = grade;
                    hako.appendChild(hidari_hako);
                    hako.appendChild(migi_hako);
                    hako.appendChild(grade_hako);
                    tabledesu.appendChild(hako);
                })
            }
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
            // アーティスト、グループにあるけど、True名が無いパターン（普通はそんなことない）
            grade = "？？";
        }else{
            grade = res.grade;
        }
        document.getElementById(dotti_short+"true_name_grade").textContent = grade;
        document.getElementById(dotti_short+"true_name_grade").classList.add("colorgrade_"+grade);
    })
    document.getElementById(dotti_short+"true_name").value = targetObj["true_"+dotti];

    // 遷移機能追加
    document.getElementById(dotti_short+"true_name").tranInfo = {destinationDIV : "true_"+dotti, destinationInfo :targetObj["true_"+dotti]};
    tranmotionIn(document.getElementById(dotti_short+"true_name"));

    
    document.getElementById(dotti_short+"last_search").textContent = targetObj["last_search"];
    document.getElementById(dotti_short+"last_index").textContent = "前回検索結果数 : "+targetObj["last_index"];
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
            console.log("poyogon");
        }else{
            console.log("neo");
            console.log(res);
            for(let i = 0 ; i < res.length ; i++)
            {
                const file_kankeid = document.createElement("div");
                const file_kankeip = document.createElement("p");
                file_kankeip.textContent = res[i]["file_name"];
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



















