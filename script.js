
// var correctNotes = [62,65,69];
// var userNotes = [];

// waxml.addEventListener("init", e => {

//     // This logic applies to a waxmp-midi-controller inside a div with class= "subtractive"
//     document.querySelector("div.subtractive waxml-midi-controller").addEventListener("keydown", e => {
//         console.log(e.detail.keyNum);

//         // add keyNum to userNotes
//         userNotes.push(e.detail.keyNum);

        
//         if(userNotes.length > correctNotes.length){
//             // remove oldest note if userNotes are longer than correctNotes
//             userNotes.shift();
//         }

//         // compare userNotes and correctNotes
//         if(JSON.stringify(userNotes) == JSON.stringify(correctNotes)){
//             // goto success page
//             window.location.href = "#success";
//         } else {
//             // print a message in a HTML element (with class="respons")
//             // (uncomment when you have such an element) 
//             // document.querySelector(".respons").innerHTML = "Keep on trying";
//             console.log("Keep on trying");
//         }

//     });



//     // // connect a function to a click on a link (in this case a link with id="btn1")
//     // document.querySelector("#btn1").addEventListener("click", e => {
       
//     //     // do something. i.e. set a variable to a value

//     //     // set correctNotes to Twinkle Twinkle
//     //     correctNotes = [60,60,67,67,69,69,67];

//     //     // reset userNotes
//     //     userNotes = [];
//     // });

// });