import fs from "fs-extra";
import ora from "ora";
import path from "path";
import puppeteer from "puppeteer";
import getThemes from "../.json/themes.json" assert { type: "json" };
const spinner = ora("Loading");
const imagesFolder = path.join(process.cwd(), "/public/themes");

const themes = getThemes.map((data) => ({
  demo: data.frontmatter.demo,
  slug: data.slug,
}));

const captureScreenshot = async (demo, slug, overwrite) => {
  const thumbnail = `${slug}.png`;
  const imagePath = path.join(imagesFolder, thumbnail);
  if (!overwrite && fs.existsSync(imagePath)) {
    return false;
  }

  try {
    const browser = await puppeteer.launch({
      args: [],
      executablePath:
        process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : process.platform === "linux"
          ? "/usr/bin/google-chrome"
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });

    spinner.text = `${demo} => capturing`;
    const page = await browser.newPage();
    await page.setViewport({
      width: 1500,
      height: 1000,
    });

    await page.goto(demo, {
      waitUntil: "networkidle0",
      timeout: 0,
    });

    // remove cookie banner
    const cookieBox = ".cookie-box";
    await page.evaluate(
      (cookieBox) =>
        document.querySelectorAll(cookieBox).forEach((el) => el.remove()),
      cookieBox
    );

    // remove themeforest preview header
    const previewHeader = ".preview__header";
    await page.evaluate(
      (previewHeader) =>
        document.querySelectorAll(previewHeader).forEach((el) => el.remove()),
      previewHeader
    );

    const hasFrame = "iframe";
    await page.evaluate(
      (hasFrame) =>
        document
          .querySelectorAll(hasFrame)
          .forEach((el) => (el.style.height = "100vh")),
      hasFrame
    );

    await page.screenshot({ path: imagePath });
    await browser.close();
  } catch {
    spinner.text = `${demo} => failed capturing`;
    return false;
  }
};

const generateScreenshots = async (themes, overwrite) => {
  spinner.start("Capturing Screenshots");
  for (const data of themes) {
    await captureScreenshot(data.demo, data.slug, overwrite);
  }
  spinner.succeed("Success - Capturing Screenshots");
};

generateScreenshots(
  themes,
  false // overwrite value
);
