import { BigInt } from "@graphprotocol/graph-ts";
import { Account } from "../generated/schema";
import { StateUpdated } from "../generated/TimedContract/TimedContract";

// Placeholder handler example. Replace with real event handlers matching your ABI.
export function handleStateUpdated(event: StateUpdated): void {
  const accountId = event.params.account.toHexString();
  let account = Account.load(accountId);
  if (account == null) {
    account = new Account(accountId);
    account.state = "INITIAL";
    account.updatedAt = BigInt.zero();
  }
  account.state = "UPDATED";
  account.updatedAt = event.block.timestamp;
  account.save();
}

