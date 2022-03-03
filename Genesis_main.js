
console.log("始めます");


const infoURL = "http://localhost:3000/information.html";
const wakupa = 28;



if(document.readyState !== "loading") {
    console.log("read終わってた");
    main();
    } else {
    console.log("read終わってなかった");
    document.addEventListener("DOMContentLoaded", main, false);
}


function main(){
    const bodyE = document.getElementsByTagName("body")[0];
    
    //まず右左の枠を作る
    //右枠を作る
    const migiWaku = document.createElement("div");
    migiWaku.id="migiWaku";
    for(let i = 0 ; ;)
    {
        migiWaku.appendChild(bodyE.childNodes[i]);
        if(bodyE.childNodes.length===0)break;
        if(i>10000)break;
    }
    migiWaku.style.width=(100-wakupa-1)+"%";

    //左枠を作る
    const hidariWaku = document.createElement("iframe");
    const hidariWakuWaku = document.createElement("div");
    hidariWaku.id="hidariWaku";
    hidariWakuWaku.id = "hidariWakuWaku";
    hidariWakuWaku.style.width = wakupa+"%";
    hidariWaku.src=infoURL;
    hidariWakuWaku.appendChild(hidariWaku);

    //左右を入れる
    bodyE.appendChild(hidariWakuWaku);
    bodyE.appendChild(migiWaku);




/////////////////////////////////////////////////////////////////



    
    let btn1 = document.createElement("input");
    btn1.type= "button";
    btn1.value="maidon";
    let btn2 = btn1.cloneNode(true);
    btn2.value = "ぺぺぺぺぺぺ"
    migiWaku.insertBefore(btn2,migiWaku.firstElementChild);
    migiWaku.insertBefore(btn1,migiWaku.firstElementChild);
    
    
    btn1.addEventListener("click",function(){
        
        let colorCode = undefined;
        const trs25 = document.getElementsByClassName("itg")[0].getElementsByTagName("tbody")[0].children;
        //ここで２５個ないとおかしいやつ.
        console.log("25個あるのか？ : "+trs25.length);
        for(let i = 0 ; i < trs25.length ; i++)
        {
            if(i ===5 )break;
            const trmigi = trs25[i].getElementsByClassName("gl2e")[0];
            //aタグ無効
            const atati = trmigi.getElementsByTagName("a");
            for(let j = 0 ; j < atati.length; j++)
            {
                atati[j].removeAttribute("href");
            }

            //onclickも無効、将来的にはここでバッジをつけるか？badgeZoneZ
            //いらん要素はcssでnoneする、バッジは７番目にdiv入れてそこに入れる形の予定
            const badgeZone = trmigi.getElementsByClassName("gl3e")[0];
            const badgeZoneZ = document.createElement("div");
            const fragE = document.createDocumentFragment();
            for(let j = 0 ; j <= 1  ; j++)
            {
                let d = document.createElement("div");
                d.className = badgeZone.children[0].className;
                d.id = badgeZone.children[0].id;
                d.textContent = badgeZone.children[0].textContent;
                fragE.appendChild(d);
                badgeZone.removeChild(badgeZone.children[0]);
            }
            badgeZone.insertBefore(fragE,badgeZone.firstElementChild);
            badgeZone.appendChild(badgeZoneZ);

            //クリックしたら枠がつくようにする,枠がついたやつをもう一回クリックするとmessegeが行く
            trmigi.addEventListener("click",function(){
                if(colorCode !== undefined)
                {
                    if(colorCode === i){
                    }else{
                        trs25[colorCode].getElementsByClassName("gl2e")[0].classList.remove("checkhighlighted");
                    } 
                }
                trmigi.classList.add("checkhighlighted");
                colorCode = i;              
            })

            
            let bookName = trs25[i].getElementsByClassName("glink")[0].textContent;
            console.log(bookName); 
        }
    });






    btn2.addEventListener("click",function(){
        hidariWaku.contentWindow.postMessage("aa",infoURL)
    });


    window.addEventListener("message",function(e){
        if(e.origin === infoURL)
        {
            console.log("massegeが来ました : " +e.data);
        }else{
            console.log("なぞメッセージ");
        }
    });

    console.log("おわりです");
}




    
