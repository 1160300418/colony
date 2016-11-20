var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d');
   
context.font = '40pt Arial';
context.fillStyle = 'cornflowerblue';
context.strokeStyle = 'black';

context.fillText("There is nothing", canvas.width/2 - 180,canvas.height/2 + 15);

context.strokeText("There is nothing", canvas.width/2 - 180,canvas.height/2 + 15 );
