type account = { price: nat; deposit: tez }
type ledger = (address, account) big_map
type storage = { ledger: ledger; oracle: address; admin: address }
type oracle_param = string * nat contract

type entrypoint =
| Hodl of unit
| Hodl_callback of nat
| Withdraw of unit
| Withdraw_callback of nat
| Update_oracle of address

(* Saves current rate with amount from user *)
let hodl (s: storage): operation list * storage = 
  if Tezos.amount = 0tez
  then (failwith "EMPTY_AMOUNT": operation list * storage)
  else
    (* Checks if user doesn't exist in ledger *)
    let new_storage: storage = match Big_map.find_opt Tezos.source s.ledger with
      | Some acc -> (failwith "ACCOUNT_EXISTS": storage)
      | None -> 
        { s with ledger = Big_map.add Tezos.source { price = 0n; deposit = Tezos.amount } s.ledger } in
    (* Prepares call to oracle *)
    let call_to_oracle: oracle_param contract = 
      match (Tezos.get_entrypoint_opt "%get" s.oracle: oracle_param contract option) with
        | None -> (failwith "NO_ORACLE_FOUND": oracle_param contract)
        | Some contract -> contract in
    (* Builds transaction *)
    let op: operation = 
      Tezos.transaction ("XTZ-USD", (Tezos.self("%hodl_callback") : nat contract)) 0tez call_to_oracle in

    [op], new_storage

(* Gets current rate from oracle to save in the storage *)
let hodl_callback (price, s: nat * storage): storage = 
  (* Checks if the tx comes from the oracle *)
  if Tezos.sender <> s.oracle
  then (failwith "UNKNOWN_SENDER": storage)
  else
    (* Fetches pre-saved entry in ledger *)
    let account: account = match Big_map.find_opt Tezos.source s.ledger with
      | None -> (failwith "NO_ACCOUNT": account)
      | Some acc -> if acc.price = 0n then acc else (failwith "UNINITIALIZED_ACCOUNT": account) 
    in
    (* Adds current XTZ to USD price *)
    let new_account: account = { account with price = price } in
    (* Saves it back into the ledger *)
    { s with ledger = Big_map.update Tezos.source (Some new_account) s.ledger }

(* Users ask to withdraw their deposit *)
let withdraw (s: storage): operation list * storage = 
  (* Checks if user has an account in the ledger *)
  let account: account = match Big_map.find_opt Tezos.source s.ledger with
    | None -> (failwith "NO_ACCOUNT": account)
    | Some acc -> acc
  in
  (* Prepares call to oracle *)
  let call_to_oracle: oracle_param contract = 
    match (Tezos.get_entrypoint_opt "%get" s.oracle: oracle_param contract option) with
      | None -> (failwith "NO_ORACLE_FOUND": oracle_param contract)
      | Some contract -> contract in
  (* Builds transaction *)
  let op: operation = 
    Tezos.transaction ("XTZ-USD", (Tezos.self("%withdraw_callback") : nat contract)) 0tez call_to_oracle in

  [op], s

(* Gets rate from oracle to allow/deny withdrawal *)
let withdraw_callback (price, s: nat * storage): operation list * storage = 
  if Tezos.sender <> s.oracle
  then (failwith "UNKNOWN_SENDER": operation list * storage)
  else
    (* Fetches price when users deposited their tez *)
    let account: account = match Big_map.find_opt Tezos.source s.ledger with
      | None -> (failwith "NO_ACCOUNT": account)
      | Some acc -> acc
    in
    (* Compares current price with previous price *)
    if price < account.price
    then (failwith "NO_WITHDRAWAL_ALLOWED": operation list * storage)
    else
      (* Current price is higher than price at deposit *)
      let recipient: unit contract = 
        match (Tezos.get_contract_opt (Tezos.source): unit contract option) with
          | None -> (failwith "NO_ADDRESS_FOUND": unit contract)
          | Some contr -> contr in
      (* Sends transaction and clears user's account *)
      [Tezos.transaction unit account.deposit recipient], 
        { s with ledger = Big_map.remove Tezos.source s.ledger }

(* Updates oracle address *)
let update_oracle (new_address, s: address * storage): storage =
  if Tezos.source = s.admin
  then
    { s with oracle = new_address }
  else
    (failwith "UNAUTHORIZED_ACTION": storage)

let main (p, s: entrypoint * storage) =
  match p with
    | Hodl -> hodl (s)
    | Hodl_callback p -> ([] : operation list), hodl_callback (p, s)
    | Withdraw p -> withdraw (s)
    | Withdraw_callback p -> withdraw_callback (p, s)
    | Update_oracle p -> ([] : operation list), update_oracle (p, s)
