export interface StatDetail {
  average: number;
  highrun: number;
  win: number;
  draw: number;
  loss: number;
  winRate: number;
  ranks: {
    average: number | null;
    highrun: number | null;
    winRate: number | null;
  };
}

export interface Member {
  nickname: string;
  avatarColor: string;
  monthly: StatDetail | null;
  allTime: StatDetail | null;
}

export const memberData: Member[] = [
  {
    nickname: "9샷캐리",
    avatarColor: "#c084fc", // purple/indigo
    monthly: {
      average: 0.624,
      highrun: 13,
      win: 13,
      draw: 0,
      loss: 7,
      winRate: 65,
      ranks: {
        average: 7,
        highrun: null,
        winRate: 6
      }
    },
    allTime: {
      average: 0.604,
      highrun: 13,
      win: 43,
      draw: 0,
      loss: 26,
      winRate: 62,
      ranks: {
        average: 42,
        highrun: 10,
        winRate: 50
      }
    }
  },
  {
    nickname: "9샷윽고",
    avatarColor: "#60a5fa", // blue
    monthly: {
      average: 0.424,
      highrun: 6,
      win: 11,
      draw: 0,
      loss: 5,
      winRate: 69,
      ranks: {
        average: 22,
        highrun: 18,
        winRate: 4
      }
    },
    allTime: {
      average: 0.432,
      highrun: 6,
      win: 51,
      draw: 0,
      loss: 31,
      winRate: 62,
      ranks: {
        average: 52,
        highrun: null,
        winRate: 52
      }
    }
  },
  {
    nickname: "9샷마스웨이",
    avatarColor: "#34d399", // emerald
    monthly: {
      average: 0.374,
      highrun: 5,
      win: 7,
      draw: 0,
      loss: 9,
      winRate: 44,
      ranks: {
        average: 24,
        highrun: 23,
        winRate: 21
      }
    },
    allTime: null
  },
  {
    nickname: "9샷레이첼",
    avatarColor: "#f472b6", // pink
    monthly: {
      average: 0.160,
      highrun: 4,
      win: 3,
      draw: 0,
      loss: 13,
      winRate: 19,
      ranks: {
        average: 35,
        highrun: 32,
        winRate: 33
      }
    },
    allTime: null
  },
  {
    nickname: "9샷케인장",
    avatarColor: "#fbbf24", // amber
    monthly: null,
    allTime: {
      average: 0.194,
      highrun: 3,
      win: 21,
      draw: 0,
      loss: 16,
      winRate: 57,
      ranks: {
        average: null,
        highrun: null,
        winRate: 88
      }
    }
  }
];
