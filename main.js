// ==UserScript==
// @name         Downloader
// @namespace    http://your.homepage/
// @version      0.1
// @description  enter something useful
// @author       You
// @match        https://unirioja.blackboard.com/webapps/portal/execute/tabs/tabAction?tab_tab_group_id=_1_1
// @grant        none
// ==/UserScript==
IdModuloMisCursos = "module:_4_1";
abiertas=0;
function loadScript(url, callback)
{
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}
loadScript('https://stuk.github.io/jszip/dist/jszip.js', function() {});
loadScript('https://stuk.github.io/jszip/vendor/FileSaver.js', function() {console.log('librerias cargadas')});

dp = new DOMParser();
window.onkeypress = function(){
  

	var misCursos = document.getElementById(IdModuloMisCursos);
    misCursos = misCursos.getElementsByTagName('li');
    //console.log(enlacesCursos);
    for(var i=0; i<misCursos.length ; i++){
        enlaceI = misCursos[i].getElementsByTagName('a')[0].getAttribute('href');
		misCursos[i].innerHTML = misCursos[i].innerHTML + '<a id="asig'+i+'">Descargar contenido</a>';
		document.getElementById('asig'+i).onclick=descargarAsignatura
	}


}
function descargarAsignatura(enlaceAsignatura){
		var enlace = enlaceAsignatura.currentTarget.parentNode.getElementsByTagName('a')[0].getAttribute('href');
		var xhr = doAJAX(enlace);
        doc = dp.parseFromString(xhr.response,"text/html");
        contenido={};
        contenido.nombre = enlaceAsignatura.currentTarget.parentNode.getElementsByTagName('a')[0].innerHTML;
        contenido.path = "";
        contenido.tipo = "carpeta";
        contenido.subElementos = getEnlacesContenido(doc,"");
        descargarContenido(contenido);
		}
function guardarZip(){
  zip = new JSZip();
  console.log(contenido);
  zipear(contenido,zip);
  generado = zip.generate({type:"blob"});
  saveAs(generado,contenido.nombre+".zip");
}
function doAJAX(enlace){
    var xhr = new XMLHttpRequest();
    xhr.open("GET",enlace,false);
    xhr.send();
    //console.log(enlace , xhr);
    return xhr;
}
function identificarContenido(contentListItem){
    var tipo = "n";
    if(contentListItem.getElementsByTagName("img")[0].getAttribute("src").search(/folder/i)>0)tipo="carpeta";
    if(contentListItem.getElementsByTagName("img")[0].getAttribute("src").search(/file/i)>0)tipo="fichero";
    return tipo;
}
function getEnlacesContenido(doc,path){
    lista = doc.getElementById("content_listContainer");
    if(lista){
    var lis = lista.children;
        var arrayEnlaces = [] ;

        //arryEnlaces.length = i;
        for(var i = 0 ; i<lis.length; i++)
        {
            arrayEnlaces[i]={};
            arrayEnlaces[i].enlace = lis[i].getElementsByTagName("a")[0].getAttribute("href");
            arrayEnlaces[i].nombre = lis[i].getElementsByTagName("a")[0].children[0].innerHTML;
            arrayEnlaces[i].path = path;
            arrayEnlaces[i].tipo = identificarContenido(lis[i]);
            if( arrayEnlaces[i].tipo === "carpeta" ){
                subxhr = doAJAX(arrayEnlaces[i].enlace);
                arrayEnlaces[i].subElementos = getEnlacesContenido(dp.parseFromString(subxhr.response,"text/html"),path+arrayEnlaces[i].nombre+"/");
            }if( arrayEnlaces[i].tipo === "fichero" )abiertas++;

        }
        return arrayEnlaces;
    }
}
function descargarContenido(nodo){
  for(var i = 0; i<nodo.subElementos.length;i++){
    if(nodo.subElementos[i].tipo === "fichero")doAJAXBlob(nodo.subElementos[i]);
    if(nodo.subElementos[i].tipo === "carpeta") descargarContenido(nodo.subElementos[i])
  }
}
   //doAJAXBlob(arrayEnlaces[i].enlace,arrayEnlaces[i],path,

function zipear(x,zip){
    //if(x){
    console.log(x);
    if( x.tipo === "carpeta" ){
         for(var i =0 ; i < x.subElementos.length; i++){
             //console.log('carpeta ' + x.path);
             zipear(x.subElementos[i],zip)
         }
     }if( x.tipo === "fichero" ){
         zip.file(x.path + x.request.responseURL.substring(x.request.responseURL.lastIndexOf('/')+1) , x.request.response , {createFolders: true});
         //console.log(x.path);
     }
    //}
}
function doAJAXBlob(file){
var subxhr1 = new XMLHttpRequest();
subxhr1.open('GET', file.enlace, true);
subxhr1.responseType = 'arraybuffer';
file.request = subxhr1;
subxhr1.onreadystatechange = function (){

	if (this.readyState == 4) {
		abiertas--;
		if(abiertas == 0)guardarZip();
	}
}
//subxhr.onload = callback(subxhr,file,path);
subxhr1.send();
}

