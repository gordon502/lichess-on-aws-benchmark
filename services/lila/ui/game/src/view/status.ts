import { Ctrl } from '../interfaces';

function bishopOnColor(expandedFen: string, offset: 0 | 1): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = row % 2 === offset ? 0 : 1; col < 8; col += 2) {
      if (/[bB]/.test(expandedFen[row * 8 + col])) return true;
    }
  }
  return false;
}

function insufficientMaterial(variant: VariantKey, fullFen: Fen): boolean {
  // TODO: atomic and antichess
  if (
    variant === 'horde' ||
    variant === 'kingOfTheHill' ||
    variant === 'racingKings' ||
    variant === 'crazyhouse' ||
    variant === 'atomic' ||
    variant === 'antichess'
  )
    return false;
  let fen = fullFen.split(' ')[0].replace(/[^a-z]/gi, '');
  if (variant === 'threeCheck') return !/[pbnrq]/.test(fen) || !/[PBNRQ]/.test(fen);
  if (/[prq]/i.test(fen)) return false;
  if (/n/.test(fen)) return fen.length - fen.replace(/[a-z]/g, '').length <= 2 && !/[PBNR]/.test(fen);
  if (/N/.test(fen)) return fen.length - fen.replace(/[A-Z]/g, '').length <= 2 && !/[pbnr]/.test(fen);
  if (/b/i.test(fen)) {
    for (let i = 8; i > 1; i--) fen = fen.replace('' + i, '1' + (i - 1));
    return (!bishopOnColor(fen, 0) || !bishopOnColor(fen, 1)) && !/[pPnN]/.test(fen);
  }
  return false;
}

export default function status(ctrl: Ctrl): string {
  const noarg = ctrl.trans.noarg,
    d = ctrl.data,
    winnerSuffix = d.game.winner ? ' • ' + noarg(d.game.winner + 'IsVictorious') : '';
  switch (d.game.status.name) {
    case 'started':
      return noarg('playingRightNow');
    case 'aborted':
      return noarg('gameAborted') + winnerSuffix;
    case 'mate':
      return noarg('checkmate') + winnerSuffix;
    case 'resign':
      return noarg(d.game.winner == 'white' ? 'blackResigned' : 'whiteResigned') + winnerSuffix;
    case 'stalemate':
      return noarg('stalemate') + winnerSuffix;
    case 'timeout':
      switch (d.game.winner) {
        case 'white':
          return noarg('blackLeftTheGame') + winnerSuffix;
        case 'black':
          return noarg('whiteLeftTheGame') + winnerSuffix;
        default:
          return `${d.game.turns % 2 === 0 ? noarg('whiteLeftTheGame') : noarg('blackLeftTheGame')} • ${noarg(
            'draw'
          )}`;
      }
    case 'draw': {
      if (insufficientMaterial(d.game.variant.key, d.game.fen))
        return `${noarg('insufficientMaterial')} • ${noarg('draw')}`;
      if (d.game.fen.split(' ')[4] === '100')
        return `${noarg('fiftyMovesWithoutProgress')} • ${noarg('draw')}`;
      if (d.game.threefold) return `${noarg('threefoldRepetition')} • ${noarg('draw')}`;
      if (d.game.drawOffers?.some(turn => turn >= d.game.turns)) return noarg('drawByMutualAgreement');
      return noarg('draw');
    }
    case 'outoftime':
      return `${d.game.turns % 2 === 0 ? noarg('whiteTimeOut') : noarg('blackTimeOut')}${
        winnerSuffix || ` • ${noarg('draw')}`
      }`;
    case 'noStart':
      return (d.game.winner == 'white' ? noarg('blackDidntMove') : noarg('whiteDidntMove')) + winnerSuffix;
    case 'cheat':
      return noarg('cheatDetected') + winnerSuffix;
    case 'variantEnd':
      switch (d.game.variant.key) {
        case 'kingOfTheHill':
          return noarg('kingInTheCenter') + winnerSuffix;
        case 'threeCheck':
          return noarg('threeChecks') + winnerSuffix;
      }
      return noarg('variantEnding') + winnerSuffix;
    case 'unknownFinish':
      return d.game.winner ? noarg(d.game.winner + 'IsVictorious') : 'Finished';
    default:
      return d.game.status.name + winnerSuffix;
  }
}
