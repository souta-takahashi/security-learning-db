const termList = document.getElementById("term-list");
const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("category-select");
const sortSelect = document.getElementById("sort-select");
const statusSelect = document.getElementById("status-select");
const addTermButton = document.getElementById("add-term-button");
const backupButton = document.getElementById("backup-button");
const restoreButton = document.getElementById("restore-button");
const backupFile = document.getElementById("backup-file");
const reviewModeButton = document.getElementById("review-mode-button");
const recordStudyButton = document.getElementById("record-study-button");
const studyStreakElement = document.getElementById("study-streak");
const studyTotalDaysElement = document.getElementById("study-total-days");
const studyHistoryCalendar = document.getElementById("study-history-calendar");
const studyRecordMessage = document.getElementById("study-record-message");

// LocalStorageから学習履歴を読み込む
let studyHistory = [];

try {
    const savedHistory = JSON.parse(
        localStorage.getItem("securityStudyHistory") || "[]"
    );

    if (
        Array.isArray(savedHistory) &&
        savedHistory.every(date =>
            typeof date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(date) &&
            !Number.isNaN(Date.parse(date + "T00:00:00Z")) &&
            new Date(date + "T00:00:00Z").toISOString().slice(0, 10) === date
        )
    ) {
        studyHistory = [...new Set(savedHistory)].sort();
    }
} catch (error) {
    console.error("学習履歴を読み込めませんでした。", error);
}

// 復習モードの状態
let reviewModeEnabled = false;

// ==============================
// 保存した学習データを読み込む
// ==============================

const savedMemos =
    JSON.parse(
        localStorage.getItem("securityMemos")
    ) || {};


const savedTerms =
    JSON.parse(
        localStorage.getItem("securityTerms")
    );


if (savedTerms) {

    terms.length = 0;

    savedTerms.forEach(term => {
        terms.push(term);
    });
}

// ==============================
// 分野一覧を自動生成
// ==============================

const categories = [...new Set(
    terms.map(term => term.category)
)];

categories.forEach(category => {

    const option = document.createElement("option");

    option.value = category;
    option.textContent = category;

    categorySelect.appendChild(option);
});

// ==============================
// 用語一覧を表示
// ==============================

function displayTerms(termData) {

    termList.innerHTML = "";

    termData.forEach(term => {

        const card =
            document.createElement("div");

        card.className = "term-card";


        // 用語名
        const name =
            document.createElement("div");

        name.className = "term-name";

        name.textContent =
            term.name;


        // 分野
        const category =
            document.createElement("div");

        category.className = "category";

        category.textContent =
            term.category;


        // 概要
        const description =
            document.createElement("p");

        description.textContent =
            term.description;


        const status = document.createElement("div");
        const currentStatus = term.status || "未学習";

        status.className = "learning-status";

        if (currentStatus === "未学習") {
            status.classList.add("status-not-started");
        } else if (currentStatus === "学習中") {
            status.classList.add("status-learning");
        } else if (currentStatus === "理解済み") {
            status.classList.add("status-completed");
        }

        status.textContent = currentStatus;


        // カードに追加
        card.appendChild(name);

        card.appendChild(category);

        card.appendChild(description);

        card.appendChild(status);


        // クリック
        card.addEventListener("click", () => {

            showTermDetail(term);

        });


        termList.appendChild(card);
    });
}

// ==============================
// 学習進捗を表示
// ==============================

function updateLearningProgress() {

    const total =
        terms.length;

    const notStarted =
        terms.filter(
            term => (term.status || "未学習") === "未学習"
        ).length;

    const learning =
        terms.filter(
            term => term.status === "学習中"
        ).length;

    const completed =
        terms.filter(
            term => term.status === "理解済み"
        ).length;

    const reviewCount = notStarted + learning;

    document.getElementById("summary-review").textContent = reviewCount;

    document.getElementById("total-count").textContent =
        total;

    document.getElementById("not-started-count").textContent =
        notStarted;

    document.getElementById("learning-count").textContent =
        learning;

    document.getElementById("completed-count").textContent =
        completed;

    document.getElementById("summary-not-started").textContent = notStarted;
    document.getElementById("summary-learning").textContent = learning;
    document.getElementById("summary-completed").textContent = completed;

    const percent =
        total === 0
            ? 0
            : Math.round((completed / total) * 100);


    document.getElementById("progress-percent").textContent =
        `理解済み：${percent}%`;

    const progressBar =
        document.getElementById("progress-bar-fill");

    progressBar.style.width =
        `${percent}%`;
}

// ==============================
// 検索・分野・並び替え
// ==============================

function filterAndSortTerms() {

    const keyword =
        searchInput.value.toLowerCase();

    const selectedCategory =
        categorySelect.value;

    const selectedSort =
        sortSelect.value;

    const selectedStatus =
        statusSelect.value;


    let filteredTerms = terms.filter(term => {

        const matchesKeyword =
            term.name.toLowerCase().includes(keyword);

        const matchesCategory =
            selectedCategory === "all" ||
            term.category === selectedCategory;

        const matchesStatus = reviewModeEnabled
            ? (term.status || "未学習") !== "理解済み"
            : (
                selectedStatus === "all" ||
                term.status === selectedStatus
            );

        return (
            matchesKeyword &&
            matchesCategory &&
            matchesStatus
        );
    });


    // 五十音順
    if (selectedSort === "reading") {

        filteredTerms.sort((a, b) =>
            a.reading.localeCompare(b.reading, "ja")
        );
    }


    // A-Z順
    else if (selectedSort === "alphabet") {

        filteredTerms.sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }


    displayTerms(filteredTerms);
}


// ==============================
// 用語詳細画面
// ==============================
function showTermDetail(term) {
    termList.innerHTML = "";

    const savedData = savedMemos[term.name] || {};
    const memo = savedData.memo || term.memo || "";
    const reference = savedData.reference || term.reference || "";
    const relatedTerms = term.relatedTerms || [];
    const status = term.status || "未学習";

    const detail = document.createElement("div");
    detail.className = "term-detail";

    // 戻るボタン
    const backButton = document.createElement("button");
    backButton.id = "back-button";
    backButton.textContent = "← 用語一覧に戻る";

    // 用語名
    const title = document.createElement("h2");
    title.textContent = term.name;

    // カテゴリ
    const category = document.createElement("div");
    category.className = "category";
    category.textContent = term.category;

    // 学習状況タイトル
    const statusTitle = document.createElement("h3");
    statusTitle.textContent = "学習状況";

    // 学習状況選択
    const statusSelectDetail = document.createElement("select");
    statusSelectDetail.id = "term-status-select";

    const statusOptions = ["未学習", "学習中", "理解済み"];

    statusOptions.forEach(statusOption => {
        const option = document.createElement("option");
        option.value = statusOption;
        option.textContent = statusOption;

        if (status === statusOption) {
            option.selected = true;
        }

        statusSelectDetail.appendChild(option);
    });

    // 読み
    const reading = document.createElement("p");
    reading.className = "reading";
    reading.textContent = `読み：${term.reading}`;

    // 概要
    const descriptionTitle = document.createElement("h3");
    descriptionTitle.textContent = "概要";

    const description = document.createElement("p");
    description.textContent = term.description;

    // 関連用語
    const relatedTitle = document.createElement("h3");
    relatedTitle.textContent = "関連用語";

    const related = document.createElement("p");
    related.textContent = relatedTerms.join(" / ");

    // メモ
    const memoTitle = document.createElement("h3");
    memoTitle.textContent = "自分の学習メモ";

    const memoInput = document.createElement("textarea");
    memoInput.id = "memo-input";
    memoInput.placeholder = "自分の言葉で理解したことを書いてみましょう。";
    memoInput.value = memo;

    // 参考書ページ
    const referenceTitle = document.createElement("h3");
    referenceTitle.textContent = "参考書ページ";

    const referenceInput = document.createElement("input");
    referenceInput.type = "text";
    referenceInput.id = "reference-input";
    referenceInput.placeholder = "例：P.128";
    referenceInput.value = reference;

    // 保存ボタン
    const saveButton = document.createElement("button");
    saveButton.id = "save-button";
    saveButton.textContent = "学習メモを保存";

    // 編集・削除ボタン
    const editButton = document.createElement("button");
    editButton.id = "edit-button";
    editButton.textContent = "✏️ 用語を編集";

    const deleteButton = document.createElement("button");
    deleteButton.id = "delete-button";
    deleteButton.textContent = "🗑️ 用語を削除";

    const hr = document.createElement("hr");

    // 画面に追加
    detail.appendChild(backButton);
    detail.appendChild(title);
    detail.appendChild(category);
    detail.appendChild(statusTitle);
    detail.appendChild(statusSelectDetail);
    detail.appendChild(reading);
    detail.appendChild(descriptionTitle);
    detail.appendChild(description);
    detail.appendChild(relatedTitle);
    detail.appendChild(related);
    detail.appendChild(memoTitle);
    detail.appendChild(memoInput);
    detail.appendChild(referenceTitle);
    detail.appendChild(referenceInput);
    detail.appendChild(saveButton);
    detail.appendChild(hr);
    detail.appendChild(editButton);
    detail.appendChild(deleteButton);

    termList.appendChild(detail);

    // 学習状況変更
    statusSelectDetail.addEventListener("change", (event) => {
        term.status = event.target.value;

        localStorage.setItem(
            "securityTerms",
            JSON.stringify(terms)
        );

        updateLearningProgress();
    });

    // メモ保存
    saveButton.addEventListener("click", () => {
        const newMemo = memoInput.value;
        const newReference = referenceInput.value;

        savedMemos[term.name] = {
            memo: newMemo,
            reference: newReference
        };

        localStorage.setItem(
            "securityMemos",
            JSON.stringify(savedMemos)
        );

        alert("学習メモを保存しました！");
    });

    // 編集
    editButton.addEventListener("click", () => {
        showEditTermForm(term);
    });

    // 削除
    deleteButton.addEventListener("click", () => {
        deleteTerm(term);
    });

    // 戻る
    backButton.addEventListener("click", () => {
        filterAndSortTerms();
    });
}

function showEditTermForm(term) {
    termList.innerHTML = "";

    const form = document.createElement("div");
    form.className = "term-detail";

    // 戻るボタン
    const backButton = document.createElement("button");
    backButton.id = "back-button";
    backButton.textContent = "← 詳細画面に戻る";

    // 用語名
    const nameLabel = document.createElement("h3");
    nameLabel.textContent = "用語名";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = "edit-name";
    nameInput.value = term.name;

    // 読み
    const readingLabel = document.createElement("h3");
    readingLabel.textContent = "読み";

    const readingInput = document.createElement("input");
    readingInput.type = "text";
    readingInput.id = "edit-reading";
    readingInput.value = term.reading;

    // 分野
    const categoryLabel = document.createElement("h3");
    categoryLabel.textContent = "分野";

    const categoryInput = document.createElement("input");
    categoryInput.type = "text";
    categoryInput.id = "edit-category";
    categoryInput.value = term.category;

    // 概要
    const descriptionLabel = document.createElement("h3");
    descriptionLabel.textContent = "概要";

    const descriptionInput = document.createElement("textarea");
    descriptionInput.id = "edit-description";
    descriptionInput.value = term.description;

    // 関連用語
    const relatedLabel = document.createElement("h3");
    relatedLabel.textContent = "関連用語";

    const relatedInput = document.createElement("input");
    relatedInput.type = "text";
    relatedInput.id = "edit-related";
    relatedInput.value = (term.relatedTerms || []).join("、");

    // 更新ボタン
    const updateButton = document.createElement("button");
    updateButton.id = "update-button";
    updateButton.textContent = "変更を保存";

    // 画面に追加
    form.appendChild(backButton);
    form.appendChild(nameLabel);
    form.appendChild(nameInput);
    form.appendChild(readingLabel);
    form.appendChild(readingInput);
    form.appendChild(categoryLabel);
    form.appendChild(categoryInput);
    form.appendChild(descriptionLabel);
    form.appendChild(descriptionInput);
    form.appendChild(relatedLabel);
    form.appendChild(relatedInput);
    form.appendChild(updateButton);

    termList.appendChild(form);

    // 更新処理
    updateButton.addEventListener("click", () => {
        const name = nameInput.value.trim();
        const reading = readingInput.value.trim();
        const category = categoryInput.value.trim();
        const description = descriptionInput.value.trim();
        const related = relatedInput.value.trim();

        // 必須チェック
        if (!name || !reading || !category || !description) {
            alert("必須項目を入力してください。");
            return;
        }

        // 文字数チェック
        if (
            name.length > 100 ||
            reading.length > 100 ||
            category.length > 50 ||
            description.length > 1000 ||
            related.length > 500
        ) {
            alert("入力文字数が多すぎます。");
            return;
        }

        // 用語情報を更新
        term.name = name;
        term.reading = reading;
        term.category = category;
        term.description = description;
        term.relatedTerms = related
            ? related.split("、").map(item => item.trim()).filter(item => item)
            : [];

        // LocalStorageに保存
        localStorage.setItem(
            "securityTerms",
            JSON.stringify(terms)
        );

        alert("用語を更新しました！");

        // 一覧に戻る
        filterAndSortTerms();
        updateLearningProgress();
    });

    // 戻る
    backButton.addEventListener("click", () => {
        showTermDetail(term);
    });
}

function deleteTerm(term) {

    const result =
        confirm(
            `「${term.name}」を削除しますか？`
        );


    if (!result) {
        return;
    }


    const index =
        terms.indexOf(term);


    if (index !== -1) {

        terms.splice(index, 1);
    }


    localStorage.setItem(
        "securityTerms",
        JSON.stringify(terms)
    );


    // 学習メモも削除

    delete savedMemos[term.name];

    localStorage.setItem(
        "securityMemos",
        JSON.stringify(savedMemos)
    );


    alert("用語を削除しました。");


    location.reload();
}

// ==============================
// 新しい用語を追加
// ==============================

function showAddTermForm() {

    termList.innerHTML = "";

    const form = document.createElement("div");

    form.className = "term-detail";

    form.innerHTML = `

        <button id="back-button">
            ← 用語一覧に戻る
        </button>

        <h2>新しい用語を追加</h2>

        <h3>用語名</h3>

        <input
            type="text"
            id="new-term-name"
            placeholder="例：SQLインジェクション"
        >

        <h3>読み</h3>

        <input
            type="text"
            id="new-term-reading"
            placeholder="例：えすきゅーえるいんじぇくしょん"
        >

        <h3>分野</h3>

        <input
            type="text"
            id="new-term-category"
            placeholder="例：セキュリティ"
        >

        <h3>概要</h3>

        <textarea
            id="new-term-description"
            placeholder="この用語について説明してください。"
        ></textarea>

        <h3>関連用語</h3>

        <input
            type="text"
            id="new-term-related"
            placeholder="例：SQL、データベース、Web"
        >

        <h3>参考書ページ</h3>

        <input
            type="text"
            id="new-term-reference"
            placeholder="例：P.150"
        >

        <button id="register-button">
            登録する
        </button>
    `;

    termList.appendChild(form);


    // ==============================
    // 登録
    // ==============================

    document
        .getElementById("register-button")
        .addEventListener("click", () => {

            const name =
                document
                    .getElementById("new-term-name")
                    .value
                    .trim();

            const reading =
                document
                    .getElementById("new-term-reading")
                    .value
                    .trim();

            const category =
                document
                    .getElementById("new-term-category")
                    .value
                    .trim();

            const description =
                document
                    .getElementById("new-term-description")
                    .value
                    .trim();

            const related =
                document
                    .getElementById("new-term-related")
                    .value
                    .trim();

            const reference =
                document
                    .getElementById("new-term-reference")
                    .value
                    .trim();


            // 必須項目チェック

            if (
                !name ||
                !reading ||
                !category ||
                !description
            ) {
                if (
                    name.length > 100 ||
                    reading.length > 100 ||
                    category.length > 50 ||
                    description.length > 1000 ||
                    related.length > 500 ||
                    reference.length > 100
                ) {
                    alert("入力文字数が多すぎます。");
                    return;
                }

                alert(
                    "用語名・読み・分野・概要は入力してください。"
                );

                return;
            }


            // 新しい用語を作成

            const newTerm = {
                name: name,
                reading: reading,
                category: category,
                description: description,
                relatedTerms: related
                    ? related.split("、").map(item => item.trim()).filter(item => item)
                    : [],
                reference: reference,
                status: "未学習",
                memo: ""
            };


            // termsに追加

            terms.push(newTerm);


            // localStorageに保存

            localStorage.setItem(
                "securityTerms",
                JSON.stringify(terms)
            );


            alert("用語を登録しました！");


            // 一覧を表示

            filterAndSortTerms();
        });


    // ==============================
    // 戻る
    // ==============================

    document
        .getElementById("back-button")
        .addEventListener("click", () => {

            filterAndSortTerms();
        });
}


function exportLearningData() {
    const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        terms: terms,
        memos: savedMemos,
        studyHistory: studyHistory
    };

    const blob = new Blob(
        [JSON.stringify(backupData, null, 2)],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "security-learning-backup.json";
    link.click();

    URL.revokeObjectURL(url);
}

function restoreLearningData(file) {
    if (!file) return;

    // 大きすぎるファイルを拒否
    if (file.size > 5 * 1024 * 1024) {
        alert("ファイルが大きすぎます。5MB以下のJSONを選択してください。");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            const restoredHistory = data.studyHistory ?? [];

            if (
                !Array.isArray(restoredHistory) ||
                !restoredHistory.every(date =>
                    typeof date === "string" &&
                    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
                    !Number.isNaN(Date.parse(date + "T00:00:00Z")) &&
                    new Date(date + "T00:00:00Z").toISOString().slice(0, 10) === date
                )
            ) {
                throw new Error("学習履歴の形式が正しくありません。");
            }
            // バックアップ形式を確認
            if (
                !data ||
                !Array.isArray(data.terms) ||
                !data.memos ||
                typeof data.memos !== "object" ||
                Array.isArray(data.memos)
            ) {
                throw new Error("バックアップ形式が正しくありません。");
            }

            // 用語データの内容を確認
            const validStatuses = ["未学習", "学習中", "理解済み"];

            const validTerms = data.terms.every(term =>
                term &&
                typeof term.name === "string" &&
                typeof term.reading === "string" &&
                typeof term.category === "string" &&
                typeof term.description === "string" &&
                (
                    term.status === undefined ||
                    validStatuses.includes(term.status)
                ) &&
                (
                    term.relatedTerms === undefined ||
                    (
                        Array.isArray(term.relatedTerms) &&
                        term.relatedTerms.every(item => typeof item === "string")
                    )
                )
            );

            if (!validTerms) {
                throw new Error("用語データに不正な項目があります。");
            }

            if (!confirm(
                "現在の学習データをバックアップの内容で置き換えます。先に現在のデータをバックアップしましたか？"
            )) {
                return;
            }

            // 既存データをバックアップ内容に置き換える
            localStorage.setItem(
                "securityTerms",
                JSON.stringify(data.terms)
            );

            localStorage.setItem(
                "securityMemos",
                JSON.stringify(data.memos)
            );

            localStorage.setItem(
                "securityStudyHistory",
                JSON.stringify([...new Set(restoredHistory)].sort())
            );

            alert("復元しました。ページを再読み込みします。");
            location.reload();

        } catch (error) {
            alert(
                "復元できませんでした。正しいバックアップJSONか確認してください。\n" +
                error.message
            );
        }
    };

    reader.onerror = () => {
        alert("ファイルを読み込めませんでした。");
    };

    reader.readAsText(file);
}

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function updateStudyHistory() {
    const today = getLocalDateString();
    const studiedDates = new Set(studyHistory);

    // 連続学習日数を計算する
    // 今日まだ記録していない場合は、昨日までの連続日数を表示する
    let checkDate = new Date();
    if (!studiedDates.has(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    let streak = 0;

    while (studiedDates.has(getLocalDateString(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    studyStreakElement.textContent = `${streak}日`;
    studyTotalDaysElement.textContent = `${studyHistory.length}日`;

    // 今日すでに記録済みならボタンを変更する
    const recordedToday = studiedDates.has(today);

    recordStudyButton.disabled = recordedToday;
    recordStudyButton.textContent = recordedToday
        ? "✓ 今日の学習は記録済みです"
        : "✅ 今日の学習を記録";

    // 直近7日間を表示する
    studyHistoryCalendar.replaceChildren();

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - i);

        const dateString = getLocalDateString(date);
        const dayElement = document.createElement("div");
        const label = document.createElement("span");
        const mark = document.createElement("strong");

        dayElement.className = "study-day";

        if (studiedDates.has(dateString)) {
            dayElement.classList.add("studied");
        }

        if (dateString === today) {
            dayElement.classList.add("today");
        }

        label.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
        mark.textContent = studiedDates.has(dateString) ? "✓" : "—";

        dayElement.append(label, mark);
        studyHistoryCalendar.appendChild(dayElement);
    }
}

// ==============================
// ページを開いたときに用語を表示
// ==============================

window.addEventListener("DOMContentLoaded", () => {

    // 既存の用語に学習状況がなければ
    // 「未学習」を設定する
    terms.forEach(term => {

        if (!term.status) {
            term.status = "未学習";
        }

        if (!term.relatedTerms) {
            term.relatedTerms = [];
        }

        if (!term.memo) {
            term.memo = "";
        }

        if (!term.reference) {
            term.reference = "";
        }
    });

    filterAndSortTerms();

    updateLearningProgress();

    updateStudyHistory();
});


// ==============================
// 検索・分野・並び替え
// ==============================

searchInput.addEventListener(
    "input",
    filterAndSortTerms
);

categorySelect.addEventListener(
    "change",
    filterAndSortTerms
);

sortSelect.addEventListener(
    "change",
    filterAndSortTerms
);

statusSelect.addEventListener(
    "change",
    filterAndSortTerms
);

// ==============================
// 用語追加ボタン
// ==============================

addTermButton.addEventListener(
    "click",
    showAddTermForm
);

backupButton.addEventListener("click", exportLearningData);

restoreButton.addEventListener("click", () => {
    backupFile.click();
});

backupFile.addEventListener("change", () => {
    const file = backupFile.files[0];

    if (file) {
        restoreLearningData(file);
    }

    // 同じファイルをもう一度選べるようにする
    backupFile.value = "";
});

reviewModeButton.addEventListener("click", () => {
    reviewModeEnabled = !reviewModeEnabled;

    reviewModeButton.textContent = reviewModeEnabled
        ? "復習モード：ON"
        : "復習モード：OFF";

    reviewModeButton.classList.toggle(
        "review-active",
        reviewModeEnabled
    );

    filterAndSortTerms();
});

recordStudyButton.addEventListener("click", () => {
    const today = getLocalDateString();

    if (studyHistory.includes(today)) {
        studyRecordMessage.textContent = "今日の学習はすでに記録されています。";
        return;
    }

    studyHistory.push(today);
    studyHistory.sort();

    localStorage.setItem(
        "securityStudyHistory",
        JSON.stringify(studyHistory)
    );

    studyRecordMessage.textContent = "今日の学習を記録しました！";
    updateStudyHistory();
});