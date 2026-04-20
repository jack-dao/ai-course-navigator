# EventBridge rule — trigger scraper at midnight PST (8:00 UTC)
resource "aws_cloudwatch_event_rule" "nightly_scrape" {
  name                = "${var.project_name}-nightly-scrape"
  description         = "Triggers the course scraper Lambda every night at midnight PST"
  schedule_expression = "cron(0 8 * * ? *)"

  tags = {
    Name = "${var.project_name}-nightly-scrape"
  }
}

# EventBridge target — the Lambda function
resource "aws_cloudwatch_event_target" "scraper_lambda" {
  rule = aws_cloudwatch_event_rule.nightly_scrape.name
  arn  = aws_lambda_function.scraper.arn
}

# Allow EventBridge to invoke the Lambda
resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scraper.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.nightly_scrape.arn
}
