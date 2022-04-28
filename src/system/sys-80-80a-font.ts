export const font = [0, 0, // NUL, SOH
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0, // Space
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    63, // 0
    6, // 1
    91, // 2
    79, // 3
    102, // 4
    109, // 5
    125, // 6
    7, // 7
    127, // 8
    103, // 9
    0,
    0,
    0,
    0,
    0,
    83, // ?
    0,
    119, // A
    207, // B
    57, // C
    143, // D
    121, // E
    113, // F
    61, // G
    118, // H
    137, // I
    30, // J
    240, // K = k
    56, // L
    183, // M
    55, // N
    63, // O
    115, // P
    103, // Q (crappy)
    49, // R
    109, // S
    129, // T
    62, // U
    184, // V
    190, // W
    118, // X
    110, // Y
    91, // Z
    0,
    0,
    0,
    0,
    0,
    0,
    119, // a = A
    0,
    88, // c
    94, // d
    121, // e = E
    193, // f
    61, // g = G
    116, // h
    4, // i
    0,
    240, // k
    128, // l
    183, // m = M
    84, // n
    92,
    115, // p
    0,
    80, // r
    109, // s = S
    192, // t
    28, // u
    0,
    0,
    0,
    110, // y
    0,
    0,
    0,
    0,
    0,
    0
];


/**
 * Eight segment characters are defined as follows:
 * TOP=A
 * TOPRIGHT=B
 * BOTTOMRIGHT=C
 * BOTTOM=D
 * BOTTOMLEFT=E
 * TOPLEFT=F
 * HORIZONTALMIDDEL=G
 * VERTICALMIDDLE=H
 * 
 * Which are then applied as bits into a byte as follows:
 * HGFEDCBA
 */