let authorizationHeader = document.getElementById("authorizationHeader");
let environment = document.getElementById("area");

document.getElementById("compareButton").addEventListener("click", async (tab) => {
    /*let responseTabID = await getCurrentTab();
    let tempUrl = responseTabID[0].url;
    let hostE = (environment.value != "prod" ? "sso-test" : "sso")
    let pathE = (environment.value != "prod" ? "stg" : "prod")
    
    await goToUrl(responseTabID[0], `https://${hostE}.o3.ru/auth/realms/${pathE}/protocol/openid-connect/auth?response_type=token&client_id=k8s.internal-headers-token&redirect_uri=http%3A%2F%2Finternal-headers-token.${pathE}.a.o3.ru%3A84%2Foauth2-redirect.html&scope=profile%20roles`)

    responseTabID = await getCurrentTab();
    const regex = /token=(.*)&token/g;
    const found = regex.exec(responseTabID[0].url)

    let token = "";
    if (found.length == 2) {
        token = `Bearer ${found[1]}`;
    }*/
    xmlHttp = new XMLHttpRequest();

    xmlHttp.open( "GET", "http://internal-headers-token.stg.a.o3.ru:80/v1/token", false ); // false for synchronous request
    xmlHttp.setRequestHeader("authorization", "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ1UmFlbnl0V1JnajFjMVRCUXpHTFpFdm5ETVNNSDMyaE1IOXhnMjV2SU1vIn0.eyJleHAiOjE3MDAwNDg5MDksImlhdCI6MTcwMDA0ODAwOSwiYXV0aF90aW1lIjoxNjk5OTQ2MzYzLCJqdGkiOiIzNDNmM2UyMy1jMDBjLTRmNGQtODU2NC04N2MwZjZjOWM4Y2MiLCJpc3MiOiJodHRwczovL3Nzby10ZXN0Lm8zLnJ1L2F1dGgvcmVhbG1zL3N0ZyIsImF1ZCI6Ims4cy5pbnRlcm5hbC1oZWFkZXJzLXRva2VuIiwic3ViIjoiYmFlMDIzODEtZTg0My00YTk2LTg1OTktNzIwNDhkNDc4ZWRmIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiazhzLmludGVybmFsLWhlYWRlcnMtdG9rZW4iLCJzZXNzaW9uX3N0YXRlIjoiNzkxYjViMjAtYzU3YS00Yzk4LWE0NjktYTQ1NjVhYTc4NmUyIiwiYWNyIjoiMCIsInNjb3BlIjoiIiwic2lkIjoiNzkxYjViMjAtYzU3YS00Yzk4LWE0NjktYTQ1NjVhYTc4NmUyIn0.OpZAjDsawHiUFRZnXBAJd6xX6l_IZpvaLy4CEhy_x5c28lt47_3CiBR4GUwpyt7a6IrtftWqdEt6Wo6dcQi7F84UGgVmBHX2vkjgC38fgJl4_OlS0esKgiVL4-zxPyr2f8y5CJVaCfgYJpkMgVqkrf_0QM47IUkKMvyeQmUn6Y5L7e_KkxkCbLGEbDYycrb6G7sq01OrQPT8qkamjV7NsygtGV0TcHJcnPBEsJjCXKJbyOb6D90MpOeNRnyChY6w9kObLUJuiwe0hnRWVOdxMyRrNeQDLL9rxUx6LAJ6YtI8cHKEKGTY0DFAIIcf0HtsGCJslZ7BDe1mr8--hTnIdA");
    xmlHttp.send( null );
    
    
    authorizationHeader.value = xmlHttp.responseText;
    authorizationHeader.select();
    navigator.clipboard.writeText(authorizationHeader.value);
    
    await goToUrl(responseTabID[0], tempUrl);
    
});

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let tab = await chrome.tabs.query(queryOptions);
  return tab;
}

function goToUrl(tab, url) {
    chrome.tabs.update(tab.id, {url});
  return new Promise(resolve => {
      chrome.tabs.onUpdated.addListener(function onUpdated(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    });
  });
}
