// ファイルが読み込まれたか確認するための即時実行ログ
console.log("----- teacher_dashboard.js が読み込まれました -----");

let isNavigatingToEdit = false;

window.addEventListener('pagehide', () => {
    // 編集画面へ行く時以外（タブ閉じなど）は解除する
    if (!isNavigatingToEdit) {
        navigator.sendBeacon('/attendance/backend/php/manage_editor.php?action=unlock');
    }
});
/**
 * ページ読み込み完了時の処理
 */
document.addEventListener('DOMContentLoaded', async () => {
    const editBtn = document.getElementById('edit-attendance-btn');
    const editingText = document.querySelector('.editing-text');
    /**
     * 現在の編集状態をサーバーに確認する関数
     */
    async function checkEditorStatus() {
        if (!editBtn || !editingText) return;

        try {
            const res = await fetch('/attendance/backend/php/manage_editor.php?action=status');
            const data = await res.json();

            if (data.is_someone_editing && !data.is_me) {
                // 自分以外の誰かが編集中の場合：ボタンを無効化
                editBtn.classList.add('disabled');
                editBtn.style.pointerEvents = 'none';
                editBtn.style.opacity = '0.5';
                editingText.textContent = `${data.editor_name}先生が編集中です`;
                editingText.style.display = 'block';
            } else {
                // 誰も編集していない、または自分が編集中の場合：ボタンを有効化
                editBtn.classList.remove('disabled');
                editBtn.style.pointerEvents = 'auto';
                editBtn.style.opacity = '1';
                editingText.style.display = 'none';
            }
        } catch (e) {
            console.error("状態確認エラー", e);
        }
    }

    // 初回チェック実行
    checkEditorStatus();

    /**
     * 5. 編集ボタンを押した時の処理
     */
    if (editBtn) {
        editBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch('/attendance/backend/php/manage_editor.php?action=lock');
                const data = await res.json();

                if (data.success) {
                    // ロック成功したらフラグを立ててから画面遷移
                    isNavigatingToEdit = true;
                    window.location.href = editBtn.href;
                } else {
                    alert(data.message);
                    checkEditorStatus();
                }
            } catch (e) {
                console.error("ロック取得エラー", e);
            }
        });
    }
});