// ==UserScript==
// @name         BlackBoardDownloader
// @version      0.1
// @description  Creates a link next to every course. It downloads all the available contents of that subject
// @author       Carlos Ruiz Ascacíbar
// @match        https://unirioja.blackboard.com/webapps/portal/execute/tabs/tabAction?tab_tab_group_id=_1_1
// @grant        none
// ==/UserScript==
IdModuloMisCursos = "module:_4_1";
abiertas=0;
/*
Includes a JavaScript library injecting an element in the HTML document.
*/
function loadScript(url, callback)
{
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = callback;
    script.onload = callback;
    head.appendChild(script);
}
loadScript('https://stuk.github.io/jszip/dist/jszip.js', function() {});
loadScript('https://stuk.github.io/jszip/vendor/FileSaver.js', function() {console.log('librerias cargadas')});

dp = new DOMParser();
/*
Adds the link next to the original course link.
*/
window.onkeypress = function(){
	var misCursos = document.getElementById(IdModuloMisCursos);
    misCursos = misCursos.getElementsByTagName('li');
    for(var i=0; i<misCursos.length ; i++){
        enlaceI = misCursos[i].getElementsByTagName('a')[0].getAttribute('href');
		misCursos[i].innerHTML = misCursos[i].innerHTML + '<a id="asig'+i+'">Descargar contenido</a>';
		document.getElementById('asig'+i).onclick=descargarAsignatura
	}
}
/*
Respons to the click event of the generated links.
in: ev, Click event
*/
function descargarAsignatura(ev){
	var enlace = ev.currentTarget.parentNode.getElementsByTagName('a')[0].getAttribute('href');
	var xhr = doAJAX(enlace);
    doc = dp.parseFromString(xhr.response,"text/html");
    contenido={};
    contenido.nombre = ev.currentTarget.parentNode.getElementsByTagName('a')[0].innerHTML;
    contenido.path = "";
    contenido.tipo = "carpeta";
    contenido.subElementos = getEnlacesContenido(doc,"");
    descargarContenido(contenido);
}
/*
Creates and saves the zip
*/
function guardarZip(){
  zip = new JSZip();
  console.log(contenido);
  zipear(contenido,zip);
  generado = zip.generate({type:"blob"});
  saveAs(generado,contenido.nombre+".zip");
}
/*
Preforms syncronous Ajax request
in: enlace, string containig the refecence for the request
out: returns xmlhttpRequest object containig the response of the request
*/
function doAJAX(enlace){
    var xhr = new XMLHttpRequest();
    xhr.open("GET",enlace,false);
    xhr.send();
    return xhr;
}
/*
Recognises content type based on the img 
in: contentListItem content to identify
out: returns string with the type of the content
*/
function identificarContenido(contentListItem){
    var tipo = "n";
    if(contentListItem.getElementsByTagName("img")[0].getAttribute("src").search(/folder/i)>0)tipo="carpeta";
    if(contentListItem.getElementsByTagName("img")[0].getAttribute("src").search(/file/i)>0)tipo="fichero";
    return tipo;
}
/*
Creates the object representing a content
*/
function getEnlacesContenido(doc,path){
    lista = doc.getElementById("content_listContainer");
    if(lista == null){
       var menu = doc.getElementById("courseMenuPalette_contents").children;
       var enla;
       for(var i =0 ; i<menu.length;i++){
  
          if(menu[i].children[0].children[0].innerHTML === "Contenido")enla = menu[i].children[0].getAttribute("href");
       }

       lista = dp.parseFromString(doAJAX(enla).response,"text/html").getElementById("content_listContainer");
    }
    if(lista){
    var lis = lista.children;
        var arrayEnlaces = [] ;
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
/*
Downloads all files
*/
function descargarContenido(nodo){
  for(var i = 0; i<nodo.subElementos.length;i++){
    if(nodo.subElementos[i].tipo === "fichero")doAJAXBlob(nodo.subElementos[i]);
    if(nodo.subElementos[i].tipo === "carpeta") descargarContenido(nodo.subElementos[i])
  }
}
/*
Adds al files to the zip
*/
function zipear(x,zip){
    //if(x){
    console.log(x);
    if( x.tipo === "carpeta" ){
         for(var i =0 ; i < x.subElementos.length; i++){
             zipear(x.subElementos[i],zip)
         }
     }if( x.tipo === "fichero" ){
         zip.file(x.path + x.request.responseURL.substring(x.request.responseURL.lastIndexOf('/')+1) , x.request.response , {createFolders: true});
     }
}
/*
Does an asyncronous call for any kind of file
*/
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
subxhr1.send();
}