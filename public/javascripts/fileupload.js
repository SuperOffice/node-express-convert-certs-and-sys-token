// $(document).ready(function() {
//     $('#pem').on('change' , function(){ uploadFile(); });
// });


// function uploadFile(element) {
//     // Get form
//     var form = $('#pem')[0].files[0];
//     var data = new FormData();
//     data.append('pem', form);

//     $('#status').text('Submitting file...'); 
//     $.ajax({
//         type: "POST",
//         enctype: 'multipart/form-data',
//         url: "/getPemFileContents",
//         data: data,
//         processData: false,
//         contentType: false,
//         cache: false,
//         success: (data) => {
//             $("#priveKeyContents").text(data);
//         },
//         error: (e) => {
//             $("#priveKeyContents").text(e.responseText);
//         },
//         complete: (xmlr, status) => {
//             $('#status').empty(); 
//         }
//     });
// }