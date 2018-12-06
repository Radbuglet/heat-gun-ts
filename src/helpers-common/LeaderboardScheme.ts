export interface ILbDBRoot {
    categories : ILbDBCategory[]
}

export interface ILbDBCategory {
    name : string
    lasts_for_mins : number,
    scores: ILbDBScore[]
}

export interface ILbDBScore {
    username : string
    score : number
    expire_timestamp : number
}