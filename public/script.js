const form = document.getElementById("inviteForm");
const photoUpload = document.getElementById("photoUpload");
const fullName = document.getElementById("fullName");
const position = document.getElementById("position");
const companySelect = document.getElementById("company");
const newCompanyInput = document.getElementById("newCompany");
const canvas = document.getElementById("invitePreview");
const ctx = canvas.getContext("2d");
const downloadBtn = document.getElementById("downloadBtn");
const templateSelect = document.getElementById("template");

let userImage = null;
let backgroundImage = new Image();

const API_BASE = window.location.origin;

// Load templates
fetch(`${API_BASE}/api/templates`)
  .then(res => res.json())
  .then(data => {
    templateSelect.innerHTML = "";
    data.forEach(tpl => {
      if (tpl.active) {
        const option = document.createElement("option");
        option.value = tpl.file;
        option.textContent = tpl.name;
        templateSelect.appendChild(option);
      }
    });

    new Choices(templateSelect, {
      searchEnabled: true,
      itemSelectText: '',
      placeholder: true,
    });
  });

  fetch(`${API_BASE}/api/companies`)
  .then(res => res.json())
  .then(companies => {
    companySelect.innerHTML = "";

    //Thêm từng công ty trước
    companies.forEach(name => {
      const option = document.createElement("option");
      option.textContent = name;
      option.value = name;
      companySelect.appendChild(option);
    });

    //Cuối cùng mới thêm dòng "Thêm công ty mới"
    const defaultOption = document.createElement("option");
    defaultOption.value = "other";
    defaultOption.textContent = "-- THÊM CÔNG TY MỚI --";
    companySelect.appendChild(defaultOption);

    new Choices(companySelect, {
      searchEnabled: true,
      itemSelectText: '',
      placeholder: true,
      shouldSort: false,
    });
  });

companySelect.addEventListener("change", () => {
  newCompanyInput.classList.toggle("hidden-company-input", companySelect.value !== "other");
});

photoUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      userImage = img;
      drawPreview();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!userImage) {
    alert("Vui lòng tải ảnh cá nhân trước khi tạo thư mời.");
    return;
  }
  drawPreview();

  if (companySelect.value === "other" && newCompanyInput.value) {
    const newCompany = newCompanyInput.value.trim();
    fetch(`${API_BASE}/api/companies/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCompany })
    });
  }
});

downloadBtn.addEventListener("click", () => {
  if (!userImage) {
    alert("Vui lòng tải ảnh cá nhân trước khi tải thư mời.");
    return;
  }
  // Lưu dữ liệu người dùng trước khi tải
  fetch(`${API_BASE}/api/save-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: fullName.value.trim(),
      position: position.value.trim(),
      company: companySelect.value === "other" ? newCompanyInput.value.trim() : companySelect.value,
      template: templateSelect.value,
      time: new Date().toISOString()
    })
  });
  // Tải ảnh
  const link = document.createElement("a");
  link.download = "thu-moi.png";
  link.href = canvas.toDataURL();
  link.click();
});

function drawPreview() {
  const width = 1280;
  const height = 1280;
  canvas.width = width;
  canvas.height = height;

  const selectedTemplate = templateSelect.value;
  if (!selectedTemplate) {
    alert("Vui lòng chọn mẫu thư mời.");
    return;
  }

  const backgroundPath = `/assets/templates/${selectedTemplate}`;
  backgroundImage.onload = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(backgroundImage, 0, 0, width, height);
    drawContents();
  };
  backgroundImage.onerror = () => {
    alert("Không thể tải ảnh nền thư mời. Vui lòng kiểm tra lại.");
  };
  backgroundImage.src = backgroundPath;
}

function drawContents() {
  const width = canvas.width;

  if (userImage) {
    const avatarSize = 250;
    const x = width / 2 - avatarSize / 2;
    const y = 320;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(userImage, x, y, avatarSize, avatarSize);
    ctx.restore();
  }

  ctx.fillStyle = "#fff";
  ctx.font = "bold 35px Montserrat, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText((fullName.value || "HỌ VÀ TÊN").toUpperCase(), width / 2, 590);
  const companyText = companySelect.value === "other" ? newCompanyInput.value : companySelect.value;
  ctx.font = "28px Montserrat, sans-serif";
  ctx.fillText(`${(position.value || "CHỨC VỤ").toUpperCase()} | ${(companyText || "CÔNG TY").toUpperCase()}`, width / 2, 630);
}
