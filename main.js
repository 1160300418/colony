'use strict'; 
var canvas = document.getElementById('main_canvas'),
    context = canvas.getContext('2d');
var colony={
    map:[],//x,y,size,camp,type
    init:function(){
        context.canvas.width=800;
        context.canvas.height=600;
        context.font = '30pt Arial';
        context.fillStyle = 'cornflowerblue';
        context.strokeStyle = 'black';
        context.fillText("testing!",50,50);
        this.loadMap();
        this.drawMap();
    },
    drawMap:function(){
        var zoom_x=context.canvas.width/80;
        var zoom_y=context.canvas.height/60;
        function drawStar(star)
        {
            var x=zoom_x*star[0],y=zoom_y*star[1],r=5*star[2],camp=star[3],type=star[4];
            context.beginPath();
            context.arc(x,y,r+10,0,2*Math.PI,true);
            context.stroke();
            switch(camp)
            {
                case 1:
                    context.fillStyle="green";
                    break;
                case 2:
                    context.fillStyle="red";
                    break;
            }
            context.fill();
            context.font = '10pt Arial';
            context.fillText((r*10).toString(),x+r-5,y+r+25);
        }
        this.map.forEach(drawStar);
    },
    loadMap:function(){
        //studying
        this.map=[[20,20,1,1,1],[20,40,2,1,1],[60,40,3,2,1]];
    },
}