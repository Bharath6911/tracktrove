export async function GET() {
  const appId = process.env.EBAY_APP_ID;
  const devId = process.env.EBAY_DEV_ID;
  const certId = process.env.EBAY_CERT_ID;
  
  return Response.json({
    ebay_app_id_exists: !!appId,
    ebay_dev_id_exists: !!devId,
    ebay_cert_id_exists: !!certId,
    app_id_preview: appId ? `${appId.substring(0, 20)}...` : "NOT SET",
    cert_id_preview: certId ? `${certId.substring(0, 20)}...` : "NOT SET",
  });
}
