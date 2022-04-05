function insertComment(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
        //TODO: display the new one
    }
 
    var commentContent = document.getElementsByClassName('post-comment' ).value ; 

    xhttp.open("POST", "/:imgId/comments", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send('{"commentContent": "'+commentContent+'"}');
} 
