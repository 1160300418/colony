var canvas = document.getElementById('main_canvas'),
    context = canvas.getContext('2d');
var colony = {
    map: [], //x,y,size,camp,type,population
    init: function () {
        context.canvas.width = 800;
        context.canvas.height = 600;
        context.font = '30pt Arial';
        context.fillStyle = 'cornflowerblue';
        context.strokeStyle = 'black';
        context.fillText("testing!", 50, 50);
        this.loadMap();
    },
    updateMap: function () {
        var zoom_x = context.canvas.width / 80;
        var zoom_y = context.canvas.height / 60;
        context.clearRect(0,0,canvas.width,canvas.height);
        this.map.forEach(
            function drawStar(star) {
                var x = zoom_x * star[0],
                    y = zoom_y * star[1],
                    r = 5 * star[2],
                    camp = star[3],
                    type = star[4];
                context.beginPath();
                context.arc(x, y, r + 10, 0, 2 * Math.PI, true);
                context.stroke();
                switch (camp) {
                    case 1:
                        context.fillStyle = "green";
                        break;
                    case 2:
                        context.fillStyle = "red";
                        break;
                }
                context.fill();
                context.font = '10pt Arial';
                context.fillText((r * 10).toString(), x + r - 5, y + r + 25);
            }
        );
    },
    loadMap: function () {
        $.getJSON("map.json", function (data) {
            $("#startBtn").hide();
            var len = data.maps.length;
            var text = "<h3 id=\"choose_tip\">Choose a map.</h3><p>";
            var map_n = 0;
            for (var i = 1; i <= len; i++) {
                text += "<button type=\"button\" class=\"choose_map\" id=\"map" + i + "\">" + i + "</button>"
            }
            $("#startBtn").after(text);
            $("button.choose_map").click(function () {
                map_n=parseInt($(this).attr("id").substring(3));
                colony.map = data.maps[map_n-1];
                colony.updateMap();
                $("button.choose_map").hide();
                $("#choose_tip").hide();
            });
        });
        //studying
        /* this.map = [
             [20, 20, 1, 1, 1, 0],
             [20, 40, 2, 1, 1, 0],
             [60, 40, 3, 2, 1, 0]
         ];*/
    },
}