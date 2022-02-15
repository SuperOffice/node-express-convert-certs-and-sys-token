// @ts-check
var express = require("express");
var router = express.Router();
var Auth = require("./authorization");
var request = require("request");
var webhookHandler = require("../controllers/webhookController");
const { registerPartial } = require("hbs");

/* GET webhook listing page. */
router.get("/", Auth.required, function(req, res) {

  if (req.session && req.session.errors) {
    res.render("webhook", {
      title: "Webhooks",
      errors: req.session.errors
    });
  }

  const webHookUrl = `${req.session.user.webapi_url}v1/Webhook`;
  const success_message = req.flash("success_msg");

  request(
      {
          url: webHookUrl,
          headers: {
              Accept: "application/json",
              Authorization: `Bearer ${req.session.user.info.accessToken}`
          }
      },  
      async function(error, response, body) 
      {
        if(response.statusCode == 401) //unauthorized
        {
          res.render("webhook-edit", {
            title: "Unauthorized",
            errors: [
              {
                msg:
                  "This application does not have access rights to the webhooks endpoint."
              },
              {
                msg: "Request access @ https://community.superoffice.com/change-application"
              }
            ]
          });

        } else if (response.statusCode == 200) {
          //console.log("\nResponse:\n" + body);
          var serverRes = JSON.parse(body);

          if(success_message) {
            res.render("webhook", {
              title: "Webhooks",
              webhooks: serverRes,
              success_msg: success_message
            });
          } else {
            res.render("webhook", {
              title: "Webhooks",
              webhooks: serverRes,
            });
          }
        }
      });
});

// get the create webhook page
router.get("/create/", function(req, res) {
  res.redirect("/webhook/edit/0");
});

// get the edit webhook page
router.get("/edit/:id",  Auth.required, function(req, res) {

  if (req.session && req.session.errors) {
    res.render("webhook-edit", {
      title: "Webhooks",
      errors: req.session.errors
    }); 
  }
  
  if(req.params.id && parseInt(req.params.id) > 0)
  {
    const webHookUrl = `${req.session.user.webapi_url}v1/Webhook/${req.params.id}`;
    request(
      {
          url: webHookUrl,
          headers: {
              Accept: "application/json",
              Authorization: `Bearer ${req.session.user.info.accessToken}`
          }
      },  
      async function(error, response, body) 
      {
          //console.log("\nResponse:\n" + body);
          var webhook = JSON.parse(body);
          
          res.render("webhook-edit", {
            title: "Edit Webhook",
            webhook: webhook,
            eventSources: webhookHandler.getWebhookEvents(webhook),
            webhookTypes: webhookHandler.getWebhookTypes(webhook),
            webhookStates:webhookHandler.getWebhookStates(webhook)
          });
      });
  } else {
    const webHookUrl = `${req.session.user.webapi_url}v1/Webhook/default`;
    request(
      {
          url: webHookUrl,
          headers: {
              Accept: "application/json",
              Authorization: `Bearer ${req.session.user.info.accessToken}`
          }
      },  
      async function(error, response, body) 
      {
        if(response.statusCode == 401) //unauthorized
        {
          res.render("webhook-edit", {
            title: "Unauthorized",
            errors: [
              {
                msg:
                  "This application does not have access rights to the webhooks endpoint."
              },
              {
                msg: "Request access @ https://community.superoffice.com/change-application"
              }
            ]
          });

        } else if (response.statusCode == 200) {
          var webhook = JSON.parse(body);
          
          res.render("webhook-edit", {
            title: "Create Webhook",
            webhook: webhook,
            eventSources: webhookHandler.getWebhookEvents(webhook),
            webhookTypes: webhookHandler.getWebhookTypes(webhook),
            webhookStates:webhookHandler.getWebhookStates(webhook)
          });
        } else {
          res.render("webhook-edit", {
            title: "Unknown error",
            errors: `Unknown error occurred. Response code: ${response.statusCode}`
          });
        }
      });
  }
  
    
 
});

// get the delete webhook page
// NOTE.. consider just deleting the webhook and returning the webhook index (listing page)
router.get("/delete/:id", Auth.required, function(req, res) {
  
  if (req.session && req.session.errors) {
    res.render("webhook-delete", {
      title: "Delete webhook",
      errors: req.session.errors
    }); 
  }

  const webHookUrl = `${req.session.user.webapi_url}v1/Webhook/${req.params.id}`;
    
  request(
      {
          url: webHookUrl,
          headers: {
              Accept: "application/json",
              Authorization: `Bearer ${req.session.user.info.accessToken}`
          }
      },  
      async function(error, response, body) 
      {
          // console.log("\nResponse:\n" + body);
          let isError = response.statusCode != 200;

          let webhook = {};

          if(isError) {
            res.render("webhook-delete", {
              title: "Delete webhook",
              error: body
            });
          }
          else {
            res.render("webhook-delete", {
              title: "Delete webhook",
              webhook: JSON.parse(body)
            });
          }          
      });
});

// get the webhook details page.
router.get("/detail/:id",  Auth.required, function(req, res) {

  if (req.session && req.session.errors) {
    res.render("webhook-detail", {
      title: "Webhooks",
      errors: req.session.errors
    }); 
  }

  const webHookUrl = `${req.session.user.webapi_url}v1/Webhook/${req.params.id}`;
    
  request(
      {
          url: webHookUrl,
          headers: {
              Accept: "application/json",
              Authorization: `Bearer ${req.session.user.info.accessToken}`
          }
      },  
      async function(error, response, body) 
      {
          console.log("\nResponse:\n" + body);
          var serverRes = JSON.parse(body);
          
          res.render("webhook-detail", {
            title: "Webhook details",
            webhook: serverRes
          });
      });
});

router.post('/saveWebhook', function(req, res) {
  
  let webhook = webhookHandler.getWebhook(req.body);

  const isNew = webhook.WebhookId > 0 ? false : true;
  const webHookUrl = isNew ? 
    `${req.session.user.webapi_url}v1/Webhook` : 
    `${req.session.user.webapi_url}v1/Webhook/${webhook.WebhookId}`;
  const method = isNew ? "POST" : "PUT";

  request(
    {
        url: webHookUrl,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${req.session.user.info.accessToken}`
        },
        method: method,
        body: JSON.stringify(webhook)
    },  
    async function(error, response, body) 
    {
        if(response.statusCode != 200) {
          //console.log("Error:\r\n", body);

          res.render("webhook-edit", {
            title: "Edit Webhook",
            webhook: webhook,
            eventSources:  webhookHandler.getWebhookEvents(webhook),
            webhookTypes:  webhookHandler.getWebhookTypes(webhook),
            webhookStates: webhookHandler.getWebhookStates(webhook),
            error_msg: body
          });
        }

        req.flash("success_msg", "Webhook successfully saved!");
        res.redirect("/webhook");
    });
});

router.post('/deleteWebhook', function(req, res) {
  
  let webhook = webhookHandler.getWebhook(req.body);
  const webHookUrl = `${req.session.user.webapi_url}v1/Webhook/${webhook.WebhookId}`;

  request(
    {
        url: webHookUrl,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${req.session.user.info.accessToken}`
        },
        method: "DELETE"
    },  
    async function(error, response, body) 
    {
        if(response.statusCode >= 400) {
          //console.log("Error:\r\n", body);
          res.render("webhook-delete", {
            title: "Delete webhook",
            webhook: webhook,
            error_msg: body
          });
        } else {
          req.flash("success_msg", "Webhook successfully saved!");
          res.redirect("/webhook");
        }
    });
});

module.exports = router;
