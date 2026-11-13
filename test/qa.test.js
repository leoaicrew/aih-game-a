import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  collapseLine,
  move,
  emptyCells,
  spawnTile,
  hasMoves,
  isGameOver,
  maxTile,
  createGame,
  applyMove,
  loadBest,
  saveBest,
  BOARD_SIZE,
  comboMultiplier,
  spawnPhase,
} from '../src/systems/logic.js';
import { AdStub } from '../src/systems/ads.js';

describe('QA Test Suite – Game A: Merge Stack', () => {

  // --- NHÓM 1: KIỂM TRA QUY TẮC GỘP & BẢNG CỜ (CORE MERGE RULES) ---
  test('TC01: Khởi tạo bàn cờ 5x5 với đúng 2 ô ban đầu', () => {
    const game = createGame();
    assert.equal(game.board.length, 5, 'Bàn cờ phải có 5 hàng');
    assert.equal(game.board[0].length, 5, 'Mỗi hàng phải có 5 cột');
    
    let tileCount = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (game.board[r][c] > 0) tileCount++;
      }
    }
    assert.equal(tileCount, 2, 'Khi bắt đầu phải có đúng 2 ô số');
    assert.equal(game.score, 0, 'Điểm ban đầu phải bằng 0');
    assert.equal(game.over, false, 'Trạng thái ban đầu không được Game Over');
  });

  test('TC02: Twist 1 – [2,2,2] không chuỗi vì ô kế tiếp là 2, không phải 4', () => {
    // 2+2->4 (base); ô thứ 3 vẫn là 2 (≠4) nên dừng, không gộp dây chuyền.
    const { result, gained } = collapseLine([1, 1, 1, 0, 0]);
    assert.deepEqual(result, [2, 1, 0, 0, 0]);
    assert.equal(gained, 4);
  });

  test('TC03: Twist 1 – 4 ô [2,2,2,2] thành 2 cặp độc lập (không chuỗi)', () => {
    // cặp 1 -> 4; ô kế là 2 (≠4) dừng; cặp 2 -> 4
    const { result, gained } = collapseLine([1, 1, 1, 1, 0]);
    assert.deepEqual(result, [2, 2, 0, 0, 0]);
    assert.equal(gained, 8);
  });

  test('TC03b: Twist 1 – [2,2,4] trượt -> 2+2=4 rồi 4 chạm 4 -> 8 (combo x1.5)', () => {
    // exponents [1,1,2] = value [2,2,4]: 2+2=4, then 4 meets 4 => chain to 8 (depth 2)
    const { result, gained, chains } = collapseLine([1, 1, 2, 0, 0]);
    assert.deepEqual(result, [3, 0, 0, 0, 0], 'Chuỗi: 2+2->4, 4+4->8');
    // base 4 (x1.0) + 8 (x1.5) = 4 + 12 = 16
    assert.equal(gained, 16, 'Điểm: 4 + 8*1.5');
    assert.deepEqual(chains, [{ index: 0, value: 8, depth: 2 }]);
  });

  test('TC04: Twist 1 – chuỗi 3 cấp [2,2,4,8] -> 16 (combo x2.0)', () => {
    const { result, gained, chains } = collapseLine([1, 1, 2, 3, 0]);
    assert.deepEqual(result, [4, 0, 0, 0, 0], '2+2->4, +4->8, +8->16');
    // 4 (x1) + 8 (x1.5) + 16 (x2) = 4 + 12 + 32 = 48
    assert.equal(gained, 48);
    assert.deepEqual(chains, [{ index: 0, value: 16, depth: 3 }]);
  });

  test('TC05: Giữ nguyên vị trí khi các ô khác giá trị dồn về cạnh', () => {
    const { result, gained } = collapseLine([1, 2, 3, 4, 5]);
    assert.deepEqual(result, [1, 2, 3, 4, 5]);
    assert.equal(gained, 0, 'Không gộp thì điểm cộng phải bằng 0');
  });

  test('TC06: Kiểm tra 4 hướng trượt bàn cờ (Up, Down, Left, Right)', () => {
    const baseBoard = [
      [1, 0, 0, 0, 1],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
    ];

    // Trượt Trái: (0,0) và (0,4) gộp thành (0,0); (4,0) và (4,4) gộp thành (4,0)
    const moveLeft = move(baseBoard, 'left');
    assert.equal(moveLeft.changed, true);
    assert.equal(moveLeft.board[0][0], 2);
    assert.equal(moveLeft.board[4][0], 2);
    assert.equal(moveLeft.gained, 8);

    // Trượt Lên: (0,0) và (4,0) gộp thành (0,0); (0,4) và (4,4) gộp thành (0,4)
    const moveUp = move(baseBoard, 'up');
    assert.equal(moveUp.changed, true);
    assert.equal(moveUp.board[0][0], 2);
    assert.equal(moveUp.board[0][4], 2);
    assert.equal(moveUp.gained, 8);
  });

  test('TC07: Trạng thái Game Over chuẩn xác khi không còn nước đi', () => {
    // Bàn cờ so le không có bất kỳ cặp ô kề nhau nào cùng giá trị
    const deadBoard = [
      [1, 2, 1, 2, 1],
      [2, 1, 2, 1, 2],
      [1, 2, 1, 2, 1],
      [2, 1, 2, 1, 2],
      [1, 2, 1, 2, 1],
    ];
    assert.equal(hasMoves(deadBoard), false, 'Không còn nước đi');
    assert.equal(isGameOver(deadBoard), true, 'Phải báo Game Over');

    // Nếu có dù chỉ 1 ô trống -> chưa Game Over
    const openBoard = deadBoard.map(row => row.slice());
    openBoard[4][4] = 0;
    assert.equal(hasMoves(openBoard), true, 'Còn ô trống thì còn nước đi');
    assert.equal(isGameOver(openBoard), false, 'Chưa Game Over khi còn ô trống');

    // Nếu bàn đầy nhưng có 2 ô kề nhau trùng giá trị -> chưa Game Over
    const mergeableBoard = deadBoard.map(row => row.slice());
    mergeableBoard[0][0] = 2; // (0,0)=2 kề (0,1)=2
    assert.equal(hasMoves(mergeableBoard), true, 'Còn gộp được thì chưa Game Over');
    assert.equal(isGameOver(mergeableBoard), false);
  });

  // --- NHÓM 2: MÔ PHỎNG GAMEPLAY & ĐỘ BỀN (STRESS TEST & BALANCE) ---
  test('TC08: Chơi tự động 50 ván liên tiếp – Đảm bảo không văng lỗi, không bất tử', () => {
    let totalMoves = 0;
    let maxScore = 0;
    let highestTileAchieved = 0;
    const dirs = ['left', 'right', 'up', 'down'];

    for (let sim = 0; sim < 50; sim++) {
      let game = createGame();
      let moves = 0;
      const MAX_SIM_MOVES = 2000;

      while (!game.over && moves < MAX_SIM_MOVES) {
        // Thử các hướng ngẫu nhiên
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const res = applyMove(game, dir);
        if (res.moved) {
          game = res.state;
          moves++;
        } else {
          // Thử hướng khác nếu hướng này kẹt
          let found = false;
          for (const alt of dirs) {
            const altRes = applyMove(game, alt);
            if (altRes.moved) {
              game = altRes.state;
              moves++;
              found = true;
              break;
            }
          }
          if (!found) break; // Kẹt thực sự
        }
      }

      totalMoves += moves;
      maxScore = Math.max(maxScore, game.score);
      const hTile = 2 ** maxTile(game.board);
      highestTileAchieved = Math.max(highestTileAchieved, hTile);

      // Kiểm tra tính toàn vẹn trạng thái
      assert.ok(game.score >= 0, 'Điểm số không được âm');
      assert.ok(!Number.isNaN(game.score), 'Điểm số không được NaN');
      assert.equal(game.board.length, 5);
      assert.equal(game.board[0].length, 5);
    }

    const avgMoves = Math.round(totalMoves / 50);
    // Ghi nhận số liệu mô phỏng
    console.log(`\n  [Mô phỏng 50 ván AI]:`);
    console.log(`  - Nước đi trung bình/ván: ${avgMoves} moves`);
    console.log(`  - Điểm cao nhất đạt được: ${maxScore}`);
    console.log(`  - Ô số cao nhất đạt được: ${highestTileAchieved}`);
    assert.ok(avgMoves > 10, 'Game phải chơi được tối thiểu 10 nước đi trước khi kết thúc');
    assert.ok(avgMoves < 1500, 'Game không bị vòng lặp vô tận (bất tử)');
  });

  // --- NHÓM 3: AN TOÀN QUẢNG CÁO & QUẢN TRỊ (GOVERNANCE & MONETIZATION SAFETY) ---
  test('TC09: Stub SDK quảng cáo tắt mặc định, không gọi mạng, trả về an toàn', async () => {
    assert.equal(AdStub.isEnabled, false, 'SDK quảng cáo phải TẮT mặc định');
    
    const rewardedResult = await AdStub.showRewarded();
    assert.equal(rewardedResult.rewarded, false);
    assert.equal(rewardedResult.reason, 'stub');

    const interstitialResult = await AdStub.showInterstitial();
    assert.equal(interstitialResult.shown, false);
    assert.equal(interstitialResult.reason, 'stub');
  });

  // --- NHÓM 5: TWIST 1 CHAIN REACTION & ĐỘ KHÓ (GDD §2, §3) ---
  test('TW01: comboMultiplier trả hệ số đúng theo GDD (1.0 / 1.5 / 2.0 / 3.0)', () => {
    assert.equal(comboMultiplier(1), 1);
    assert.equal(comboMultiplier(2), 1.5);
    assert.equal(comboMultiplier(3), 2);
    assert.equal(comboMultiplier(4), 3);
    assert.equal(comboMultiplier(5), 3, 'Chuỗi từ 4 trở lên giữ x3.0 (Mega Combo)');
  });

  test('TW02: Mega Combo 4 cấp [2,2,4,8,16] -> 32 với hệ số x3.0 ở bậc 4', () => {
    // 2+2->4, +4->8, +8->16, +16->32 (depth 4)
    const { result, gained, chains } = collapseLine([1, 1, 2, 3, 4]);
    assert.deepEqual(result, [5, 0, 0, 0, 0]);
    // 4*1 + 8*1.5 + 16*2 + 32*3 = 4 + 12 + 32 + 96 = 144
    assert.equal(gained, 144);
    assert.deepEqual(chains, [{ index: 0, value: 32, depth: 4 }]);
  });

  test('TW03: move() báo combos + maxChain cho chuỗi trong một lượt', () => {
    const board = [
      [1, 1, 2, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const res = move(board, 'left');
    assert.equal(res.changed, true);
    assert.equal(res.board[0][0], 3, '2+2->4 rồi chạm 4 -> 8');
    assert.equal(res.maxChain, 2);
    assert.equal(res.combos.length, 1);
    assert.deepEqual(
      { r: res.combos[0].r, c: res.combos[0].c, value: res.combos[0].value },
      { r: 0, c: 0, value: 8 },
    );
  });

  test('TW04: Không có chuỗi thì combos rỗng, maxChain = 0', () => {
    const board = [
      [1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const res = move(board, 'left');
    assert.equal(res.maxChain, 0);
    assert.deepEqual(res.combos, []);
  });

  test('DF01: Deng độ khó spawn đúng 3 giai đoạn theo điểm (GDD §3)', () => {
    assert.deepEqual(spawnPhase(0), { p4: 0.1, p8: 0 });
    assert.deepEqual(spawnPhase(499), { p4: 0.1, p8: 0 });
    assert.deepEqual(spawnPhase(500), { p4: 0.2, p8: 0 });
    assert.deepEqual(spawnPhase(1999), { p4: 0.2, p8: 0 });
    assert.deepEqual(spawnPhase(2000), { p4: 0.25, p8: 0.05 });
  });

  test('DF02: spawnTile tôn trọng trọng số giai đoạn 3 (có xuất hiện ô 8)', () => {
    const board = Array.from({ length: 5 }, () => Array(5).fill(0));
    // rng cố định: lần 1 chọn ô trống, lần 2 roll. 0.02 < p8(0.05) => ô 8 (exp 3)
    let calls = 0;
    const rng = () => {
      calls++;
      return calls === 1 ? 0 : 0.02;
    };
    spawnTile(board, rng, 2000);
    assert.equal(board[0][0], 3, 'Giai đoạn 3 phải có 5% sinh ô 8');
  });

  // --- NHÓM 4: BẢN BUILD & VIEWPORT TĨNH ---
  test('TC10: Kiểm tra file index.html cấu hình chuẩn Mobile Viewport (Không zoom)', () => {
    const indexPath = path.join(process.cwd(), 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(content.includes('name="viewport"'), 'Phải có thẻ meta viewport');
    assert.ok(content.includes('user-scalable=no'), 'Phải khóa user-scalable để tránh zoom nhầm khi vuốt');
    assert.ok(content.includes('width=device-width'), 'Phải có width=device-width');
    assert.ok(content.includes('id="game"'), 'Phải có container div #game cho canvas');
  });

  test('TC11: Kiểm tra cấu hình tỉ lệ màn hình Phaser (Scale.FIT 480x800)', () => {
    const mainPath = path.join(process.cwd(), 'src/main.js');
    const content = fs.readFileSync(mainPath, 'utf-8');

    assert.ok(content.includes('Scale.FIT') || content.includes('FIT'), 'Phải dùng Phaser Scale.FIT');
    assert.ok(content.includes('480'), 'Chiều rộng chuẩn 480px');
    assert.ok(content.includes('800'), 'Chiều cao chuẩn 800px');
  });

  // --- NHÓM 5: SẴN SÀNG PHÁT HÀNH TĨNH (hosting miễn phí) ---
  test('TC12: Vite dùng base tương đối để chạy được ở subpath GitHub Pages', () => {
    const cfgPath = path.join(process.cwd(), 'vite.config.js');
    const content = fs.readFileSync(cfgPath, 'utf-8');

    assert.ok(/base:\s*['"]\.\/['"]/.test(content), "base phải là './' để asset không tuyệt đối hóa theo domain");
  });

  test('TC13: CREDITS.txt ghi giấy phép Phaser (MIT) và tuyên bố không thu dữ liệu', () => {
    const creditsPath = path.join(process.cwd(), 'public', 'CREDITS.txt');
    const content = fs.readFileSync(creditsPath, 'utf-8');

    assert.ok(/Phaser[\s\S]*MIT/.test(content), 'Phải ghi Phaser MIT');
    assert.ok(/không thu thập dữ liệu cá nhân/i.test(content), 'Phải tuyên bố không thu dữ liệu cá nhân');
  });

  test('TC14: Có workflow deploy GitHub Pages kích hoạt thủ công (không tự chạy khi push)', () => {
    const wfPath = path.join(process.cwd(), '.github', 'workflows', 'deploy-pages.yml');
    const content = fs.readFileSync(wfPath, 'utf-8');

    assert.ok(content.includes('workflow_dispatch'), 'Deploy phải kích hoạt tay bằng workflow_dispatch');
    assert.ok(!/^\s*on:\s*\[?\s*push/m.test(content), 'Không được tự deploy khi push');
    assert.ok(content.includes('npm run build'), 'Workflow phải build site tĩnh');
  });
});
