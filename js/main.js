const headerEl = document.querySelector(".header");
const urlInput = document.querySelector(".url-input input");
const messageEl = document.querySelector(".message");
const outputPanel = document.querySelector(".output-panel");
const downloadMenu = outputPanel.querySelector(".download-menu tbody");
const preview = outputPanel.querySelector(".preview");

let currentData = null;
let isLoading = false;

async function fetchData() {
  if (isLoading) return;
  isLoading = true;
  const videoId = getVideoId(urlInput.value);
  messageEl.classList.toggle("hidden", videoId);
  if (!videoId) {
    messageEl.textContent = "Please enter a valid video URL";
    return;
  }

  const url = `https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${videoId}&urlAccess=normal&videos=auto&audios=auto`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": "b9cfa18b70mshca5c43de2f67d55p1a81bdjsnec2cdad998fa",
      "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com",
    },
  };

  const response = await fetch(url, options);
  const result = await response.json();

  currentData = result;

  updateDownloadMenu();
  updatePreview();
  headerEl.style.marginTop = "20px";

  isLoading = false;
}

function updateDownloadMenu() {
  const audios = currentData.audios.items.slice(0, 3);
  const videos = currentData.videos.items.slice(0, 3);
  const subtitles = currentData.subtitles.items.slice(0, 3);

  const hasItems = [audios, videos, subtitles].some((arr) => arr.length > 0);
  outputPanel.classList.toggle("hidden", !hasItems);

  downloadMenu.innerHTML = `
    <tr>
      <th colspan="3"><i class="bi bi-music-note-beamed"></i> Audio</th>
    </tr>
    ${audios
      .map(
        (item) => `
        <tr>
          <td>${item.extension}</td>
          <td>${item.sizeText}</td>
          <td><button class="button" onclick="window.open('${item.url}', '_blank')">Download</button></td>
        </tr> 
      `,
      )
      .join("")}
    <tr>
      <th colspan="3"><i class="bi bi-camera-video-fill"></i> Video</th>
    </tr>
       ${videos
         .map(
           (item) => `
        <tr>
          <td>${item.quality}</td>
          <td>${item.sizeText}</td>
          <td><button class="button" onclick="window.open('${item.url}', '_blank')">Download</button></td>
        </tr>
      `,
         )
         .join("")}
    <tr>
      <th colspan="3"><i class="bi bi-badge-cc-fill"></i> Subtitle</th>
    </tr>
       ${subtitles
         .map(
           (item) => `
        <tr> 
          <td colspan="2">${item.code}</td>
          <td><button class="button" onclick="downloadSubtitle('${item.url}')">Download</button></td>
        </tr>  
      `,
         )
         .join("")}
  `;
}

function updatePreview() {
  preview.innerHTML = `
    <img class="thumbnail" src="${currentData.thumbnails[0].url}">
    <select onchange="downloadThumbnail(this.value)">
      <option value="">Download Thumbnail</option>
      ${currentData.thumbnails.map(
        (thumbnail) => `
        <option value="${thumbnail.url}">${thumbnail.width}x${thumbnail.height}</option>  
      `,
      )}
    </select>     
    <h2 class="title">${currentData.title}</h2>
    <p class="duration">Duration: ${formatTime(currentData.lengthSeconds)}</p>
  `;
}

function getVideoId(url) {
  const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|live\/|.*[?&]v=))([^"&?\/\s]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  return videoId;
}

function downloadThumbnail(url) {
  if (!url) return;
  download(url, `${currentData.title}.jpg`);
}

async function downloadSubtitle(url) {
  const response = await fetch(url);
  const xmlText = await response.text();
  const srtText = convertXmlToSrt(xmlText);

  const blob = new Blob([srtText]);
  const blobUrl = URL.createObjectURL(blob);
  download(blobUrl, `${currentData.title}.srt`);
}
