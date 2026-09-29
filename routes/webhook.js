// @ts-check
var express = require("express");
var router = express.Router();
var Auth = require("./authorization");
var send = require("../controllers/httpclient");
var webhookHandler = require("../controllers/webhookController");

/* GET webhook listing page. */
router.get("/", Auth.required, async function(req, res, next) {

  if (req.session && req.session.errors) {
    return res.render("webhook", {
      title: "Webhooks",
      errors: req.session.errors
    });
  }

  const webHookUrl = `${req.user.webapi_url}v1/Webhook`;
  const success_message = req.flash("success_msg");

  try {
    const response = await send({
      url: webHookUrl,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${req.user.info.accessToken}`
      }
    });

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
      //console.log("\nResponse:\n" + response.body);
      var serverRes = JSON.parse(response.body);

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
    } else {
      res.render("webhook", {
        title: "Webhooks",
        error_msg: `Unknown error occurred. Response code: ${response.statusCode}`
      });
    }
  } catch (error) {
    next(error);
  }
});

// get the create webhook page
router.get("/create/", function(req, res) {
  res.redirect("/webhook/edit/0");
});

// get the edit webhook page
router.get("/edit/:id",  Auth.required, async function(req, res, next) {

  if (req.session && req.session.errors) {
    return res.render("webhook-edit", {
      title: "Webhooks",
      errors: req.session.errors
    });
  }

  try {
    if(req.params.id && parseInt(req.params.id) > 0)
    {
      const webHookUrl = `${req.user.webapi_url}v1/Webhook/${req.params.id}`;
      const response = await send({
        url: webHookUrl,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${req.user.info.accessToken}`
        }
      });

      //console.log("\nResponse:\n" + response.body);
      var webhook = JSON.parse(response.body);

      res.render("webhook-edit", {
        title: "Edit Webhook",
        webhook: webhook,
        eventSources: webhookHandler.getWebhookEvents(webhook),
        webhookTypes: webhookHandler.getWebhookTypes(webhook),
        webhookStates:webhookHandler.getWebhookStates(webhook)
      });
    } else {
      const webHookUrl = `${req.user.webapi_url}v1/Webhook/default`;
      const response = await send({
        url: webHookUrl,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${req.user.info.accessToken}`
        }
      });

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
        var webhook = JSON.parse(response.body);

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
    }
  } catch (error) {
    next(error);
  }
});

// get the delete webhook page
// NOTE.. consider just deleting the webhook and returning the webhook index (listing page)
router.get("/delete/:id", Auth.required, async function(req, res, next) {

  if (req.session && req.session.errors) {
    return res.render("webhook-delete", {
      title: "Delete webhook",
      errors: req.session.errors
    });
  }

  const webHookUrl = `${req.user.webapi_url}v1/Webhook/${req.params.id}`;

  try {
    const response = await send({
      url: webHookUrl,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${req.user.info.accessToken}`
      }
    });

    // console.log("\nResponse:\n" + response.body);
    let isError = response.statusCode != 200;

    if(isError) {
      res.render("webhook-delete", {
        title: "Delete webhook",
        error: response.body
      });
    }
    else {
      res.render("webhook-delete", {
        title: "Delete webhook",
        webhook: JSON.parse(response.body)
      });
    }
  } catch (error) {
    next(error);
  }
});

// get the webhook details page.
router.get("/detail/:id",  Auth.required, async function(req, res, next) {

  if (req.session && req.session.errors) {
    return res.render("webhook-detail", {
      title: "Webhooks",
      errors: req.session.errors
    });
  }

  const webHookUrl = `${req.user.webapi_url}v1/Webhook/${req.params.id}`;

  try {
    const response = await send({
      url: webHookUrl,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${req.user.info.accessToken}`
      }
    });

    console.log("\nResponse:\n" + response.body);
    var serverRes = JSON.parse(response.body);

    res.render("webhook-detail", {
      title: "Webhook details",
      webhook: serverRes
    });
  } catch (error) {
    next(error);
  }
});

router.post('/saveWebhook', Auth.required, async function(req, res, next) {

  let webhook = webhookHandler.getWebhook(req.body);

  const isNew = webhook.WebhookId > 0 ? false : true;
  const webHookUrl = isNew ?
    `${req.user.webapi_url}v1/Webhook` :
    `${req.user.webapi_url}v1/Webhook/${webhook.WebhookId}`;
  const method = isNew ? "POST" : "PUT";

  try {
    const response = await send({
      url: webHookUrl,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.user.info.accessToken}`
      },
      method: method,
      body: JSON.stringify(webhook)
    });

    if(response.statusCode != 200) {
      //console.log("Error:\r\n", response.body);

      return res.render("webhook-edit", {
        title: "Edit Webhook",
        webhook: webhook,
        eventSources:  webhookHandler.getWebhookEvents(webhook),
        webhookTypes:  webhookHandler.getWebhookTypes(webhook),
        webhookStates: webhookHandler.getWebhookStates(webhook),
        error_msg: response.body
      });
    }

    req.flash("success_msg", "Webhook successfully saved!");
    res.redirect("/webhook");
  } catch (error) {
    next(error);
  }
});

router.post('/deleteWebhook', Auth.required, async function(req, res, next) {

  let webhook = webhookHandler.getWebhook(req.body);
  const webHookUrl = `${req.user.webapi_url}v1/Webhook/${webhook.WebhookId}`;

  try {
    const response = await send({
      url: webHookUrl,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.user.info.accessToken}`
      },
      method: "DELETE"
    });

    if(response.statusCode >= 400) {
      //console.log("Error:\r\n", response.body);
      res.render("webhook-delete", {
        title: "Delete webhook",
        webhook: webhook,
        error_msg: response.body
      });
    } else {
      req.flash("success_msg", "Webhook successfully saved!");
      res.redirect("/webhook");
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
